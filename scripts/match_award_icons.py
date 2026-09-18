#!/usr/bin/env python3
"""Match award icon files in public/images/awards/<folder>/ to award ids.

Usage: python3 scripts/match_award_icons.py

Reads the award catalog from supabase/011_awards_catalog.sql, pairs each award with
the best-named image file, and writes lib/awardIcons.js. Prints every pairing plus
anything left unmatched so it can be checked by eye. Re-run it whenever you add icons.

Rules
- Special Forces items never mix with standard ones. In the catalog, anything with
  "Specialist" in its name is a Special Forces award; on disk those are the BF2SF.*
  files. They only match each other, so "Assault Combat" can't take the
  "Assault Specialist" icon or the other way round.
- Files named like "Name (1).webp" and anything in a "frontview" subfolder are ignored.
- Badges come in three tiers per award (Basic, Veteran, Expert). They are matched as a
  set, so each badge maps to {1: basic file, 2: veteran file, 3: expert file}.
"""
import difflib
import os
import re
import sys
from urllib.parse import unquote

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
ICON_DIR = os.path.join(ROOT, "public", "images", "awards")
CATALOG = os.path.join(ROOT, "supabase", "011_awards_catalog.sql")
OUT = os.path.join(ROOT, "lib", "awardIcons.js")

FOLDER_CATEGORIES = {
    "medals": ["Medals"],
    "ribbons": ["Ribbons"],
    "badges": ["Badges", "Other Badges"],
}
GENERIC = {"bf2", "bf2sf", "perspective", "front", "medal", "ribbon", "award", "badge", "the"}
EXTENSIONS = (".webp", ".png", ".jpg", ".jpeg", ".svg")
THRESHOLD = 0.8
TIERS = {"basic": 1, "veteran": 2, "expert": 3}

# Award ids whose icon file is named differently from the game's award name.
ALIASES = {
    2190308: "Helicopter Combat Medal",
    2260914: "Insurgent Special Forces Medal",
    1261115: "Special Ops Specialist",
    3212201: "Valorous Unit Ribbon",  # listed as "Valorous Merit Ribbon" on BF2Hub
    3260803: "Helicopter Specialist",
}


def normalize(text, drop_specialist=False):
    text = unquote(text).lower().replace("'", "").replace("’", "")
    text = re.sub(r"\bu\.s\.", "us", text)
    generic = GENERIC | ({"specialist", "specialistst"} if drop_specialist else set())
    tokens = [t for t in re.split(r"[^a-z0-9]+", text) if t and t not in generic]
    # singularise so "Seals" and "SEAL" line up, and drop a leading "us"
    tokens = [t[:-1] if len(t) > 3 and t.endswith("s") else t for t in tokens]
    if tokens and tokens[0] == "us":
        tokens = tokens[1:]
    return "".join(tokens)


def read_catalog():
    rows = []
    with open(CATALOG, encoding="utf-8") as fh:
        for m in re.finditer(r"^\s+\((\d+), '((?:[^']|'')*)', '([^']*)'", fh.read(), re.M):
            rows.append((int(m.group(1)), m.group(2).replace("''", "'"), m.group(3)))
    return rows


def list_files(folder):
    base = os.path.join(ICON_DIR, folder)
    return [
        f for f in sorted(os.listdir(base))
        if os.path.isfile(os.path.join(base, f))
        and f.lower().endswith(EXTENSIONS)
        and not re.search(r" \(\d+\)\.", f)
    ]


def is_sf_award(name):
    return "specialist" in name.lower()


def ratio(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


def assign(scored, mapping_out, value_for):
    """Greedy one-to-one matching, best score first."""
    used_awards, used_keys, pairs = set(), set(), []
    for score, award_id, name, key in sorted(scored, key=lambda s: -s[0]):
        if score < THRESHOLD or award_id in used_awards or key in used_keys:
            continue
        used_awards.add(award_id)
        used_keys.add(key)
        mapping_out[award_id] = value_for(key)
        pairs.append((score, name, key))
    return used_awards, used_keys, pairs


def match_single_files(folder, catalog, mapping):
    """Medals and ribbons: one image per award."""
    files = list_files(folder)
    awards = [(i, n) for i, n, c in catalog if c in FOLDER_CATEGORIES[folder]]
    scored = []
    for award_id, name in awards:
        for f in files:
            # "Specialist" ribbons are Special Forces awards; keep them apart from the rest.
            if folder == "ribbons" and is_sf_award(name) != ("specialist" in f.lower()):
                continue
            match_name = ALIASES.get(award_id, name)
            score = ratio(normalize(match_name), normalize(os.path.splitext(f)[0]))
            scored.append((score, award_id, name, f))
    used_awards, used_files, pairs = assign(scored, mapping, lambda f: f"{folder}/{f}")
    report(folder, pairs, awards, used_awards, files, used_files)


def match_badges(catalog, mapping):
    """Badges: three tier files per award, grouped by (family, badge name)."""
    files = list_files("badges")
    groups = {}
    pattern = re.compile(r"^(BF2SF|BF2)\.(Basic|Veteran|Expert)_(.+?)(?:_Badge)?_Perspective", re.I)
    unparsed = []
    for f in files:
        m = pattern.match(f)
        if not m:
            unparsed.append(f)
            continue
        family, tier, base = m.group(1).upper(), m.group(2).lower(), m.group(3)
        base = base.replace("Specialistst", "Specialist")  # typo in some Zip Line file names
        groups.setdefault((family, base), {})[TIERS[tier]] = f

    awards = [(i, n) for i, n, c in catalog if c in FOLDER_CATEGORIES["badges"]]
    scored = []
    for award_id, name in awards:
        sf_award = is_sf_award(name)
        for (family, base) in groups:
            if sf_award != (family == "BF2SF"):
                continue  # keep Special Forces and standard badges apart
            match_name = ALIASES.get(award_id, name)
            score = ratio(normalize(match_name, True), normalize(base, True))
            scored.append((score, award_id, name, (family, base)))

    used_awards, used_keys, pairs = assign(
        scored, mapping,
        lambda key: {t: f"badges/{groups[key][t]}" for t in sorted(groups[key])},
    )
    tiers_missing = [f"{b} ({sorted({1, 2, 3} - set(groups[(fam, b)]))})" for fam, b in used_keys if len(groups[(fam, b)]) < 3]

    print(f"\n== badges: {len(used_awards)} of {len(awards)} awards matched, {len(groups)} badge sets ({len(files)} files) ==")
    for score, name, (family, base) in sorted(pairs, key=lambda p: p[1]):
        tiers = "/".join(str(t) for t in sorted(groups[(family, base)]))
        print(f"  {score:4.2f}  {name:40s} <- {family}.{base}  [tiers {tiers}]")
    missing = [n for i, n in awards if i not in used_awards]
    extra = [f"{fam}.{b}" for fam, b in groups if (fam, b) not in used_keys]
    if missing:
        print(f"  no icon yet for: {', '.join(missing)}")
    if extra:
        print(f"  badge sets that matched no award: {', '.join(extra)}")
    if tiers_missing:
        print(f"  badges missing a tier: {', '.join(tiers_missing)}")
    if unparsed:
        print(f"  files whose names could not be read: {', '.join(unparsed)}")


def report(folder, pairs, awards, used_awards, files, used_files):
    print(f"\n== {folder}: {len(used_awards)} of {len(awards)} awards matched, {len(files)} usable files ==")
    for score, name, f in sorted(pairs, key=lambda p: p[1]):
        print(f"  {score:4.2f}  {name:42s} <- {f}")
    missing = [n for i, n in awards if i not in used_awards]
    extra = [f for f in files if f not in used_files]
    if missing:
        print(f"  no icon yet for: {', '.join(missing)}")
    if extra:
        print(f"  files that matched no award: {', '.join(extra)}")


def js_value(value):
    if isinstance(value, dict):
        return "{ " + ", ".join(f"{k}: {v!r}" for k, v in sorted(value.items())) + " }"
    return repr(value)


def main(folders):
    catalog = read_catalog()
    mapping = {}
    for folder in folders:
        if folder not in FOLDER_CATEGORIES or not os.path.isdir(os.path.join(ICON_DIR, folder)):
            print(f"skipping '{folder}' (not a matchable folder or it does not exist)")
        elif folder == "badges":
            match_badges(catalog, mapping)
        else:
            match_single_files(folder, catalog, mapping)

    lines = [
        "// Generated by scripts/match_award_icons.py from the files in public/images/awards.",
        "// Award id -> icon file, relative to /images/awards/. Badges map each tier",
        "// (1 Basic, 2 Veteran, 3 Expert) to its own file. Re-run the script after adding icons.",
        "export const AWARD_ICON_FILES = {",
    ]
    for award_id in sorted(mapping):
        lines.append(f"  {award_id}: {js_value(mapping[award_id])},")
    lines.append("};")
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"\nWrote {len(mapping)} icon mappings to lib/awardIcons.js")


if __name__ == "__main__":
    main(list(FOLDER_CATEGORIES))  # always all folders, so the generated map is complete
