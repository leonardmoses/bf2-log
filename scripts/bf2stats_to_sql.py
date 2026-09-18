#!/usr/bin/env python3
"""Turn a BF2Statistics MySQL dump (.frm/.MYD/.MYI files) into Supabase SQL.

Usage:  python3 scripts/bf2stats_to_sql.py data/bf2stats_2026_9-18

Loads a copy of the files into a throwaway MariaDB container (Docker required), so the
originals are never modified, and writes ready-to-run SQL into
supabase/imports/<dump folder name>/ :

  1_players.sql          player standings (score, wins, kills, ...)            always
  2_new_awards.sql       placeholder catalog rows for award ids we don't know   only if needed
  3_profiles_N.sql       full profile stats + earned awards (split into parts)  always
  4_rounds.sql           new rounds (dated) + links to sessions you logged      only if needed
  RUN_ORDER.txt          what to run, in order, and every warning

Everything is safe to re-run. Player IP addresses are never read or exported.
Rounds are paired against your live session log, which is read (public read access)
using NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local.
Settings (map names, size rules, timezone) live in scripts/bf2stats_config.py.
"""
import collections
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(__file__))
import bf2stats_config as cfg  # noqa: E402

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
IMPORTS_DIR = os.path.join(ROOT, "supabase", "imports")
CATALOG_SQL = os.path.join(ROOT, "supabase", "011_awards_catalog.sql")
BASELINE = os.path.join(os.path.dirname(__file__), "bf2stats_known_columns.json")

CONTAINER = "bf2stats_import"
ROOT_PW = "bf2pass"
CHUNK = 30
PART_BYTES = 100_000
USED_TABLES = ["player", "kits", "weapons", "vehicles", "army", "awards", "round_history", "mapinfo", "kills"]
MIN_KITS, MIN_VEHICLES = 7, 6  # the standard BF2 kits and vehicle classes; extras appear only when used


# ----------------------------------------------------------------------------- helpers

def sh(*args, check=True, **kw):
    return subprocess.run(args, check=check, capture_output=True, text=True, **kw)


def run_sql(sql, header=False):
    cmd = ["docker", "exec", CONTAINER, "mariadb", "-uroot", f"-p{ROOT_PW}",
           "--default-character-set=utf8mb4", "--batch", "--raw"]
    if not header:
        cmd.append("-N")
    cmd += ["-e", sql]
    return [line.split("\t") for line in sh(*cmd).stdout.splitlines() if line]


def select_dicts(sql):
    rows = run_sql(sql, header=True)
    if not rows:
        return []
    cols, body = rows[0], rows[1:]
    return [dict(zip(cols, r)) for r in body]


def lit(value):
    return "'" + str(value).replace("'", "''") + "'"


def to_int(v):
    return int(v) if v not in ("", "NULL", None) else 0


def grouped(rec, prefixes, count):
    """[[rec['<p>0'], rec['<p>1'], ...], ...] for each index 0..count-1."""
    return [[to_int(rec[f"{p}{i}"]) for p in prefixes] for i in range(count)]


def numbered_count(rec, prefix):
    """How many <prefix><n> columns a table row has (time0, time1, ... -> count)."""
    return len([k for k in rec if re.fullmatch(rf"{prefix}\d+", k)])


def trim_trailing(rows, minimum):
    """Keep at least `minimum` rows, plus any later rows up to the last one with activity."""
    last = max([i for i, r in enumerate(rows) if r[0] > 0], default=-1)
    return rows[: max(minimum, last + 1)]


# ----------------------------------------------------------------------------- live data

def load_env():
    env = {}
    path = os.path.join(ROOT, ".env.local")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            m = re.match(r"\s*([A-Z_]+)\s*=\s*(.*?)\s*$", line)
            if m:
                env[m.group(1)] = m.group(2).strip("'\"")
    return env


def rest_get(env, path):
    """GET every row of a PostgREST query (pages of 1000). Raises on any error."""
    base, key = env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    rows, offset = [], 0
    while True:
        req = urllib.request.Request(
            f"{base}/rest/v1/{path}", headers={"apikey": key, "Authorization": f"Bearer {key}",
                                              "Range-Unit": "items", "Range": f"{offset}-{offset + 999}"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            page = json.load(resp)
        rows += page
        if len(page) < 1000:
            return rows
        offset += 1000


def load_live(warnings):
    """Read the current maps, session log and award catalog from the live site. None on failure."""
    env = load_env()
    if "NEXT_PUBLIC_SUPABASE_URL" not in env or "NEXT_PUBLIC_SUPABASE_ANON_KEY" not in env:
        warnings.append("LIVE DATA UNAVAILABLE: .env.local has no Supabase URL/key, so rounds were NOT processed.")
        return None
    try:
        maps = rest_get(env, "bf2_maps?select=sort_order,name,supports_16,supports_32,supports_64&order=sort_order")
        awards = rest_get(env, "bf2_awards?select=id")
        cols = "id,player_count,map_size,bot_count,result,difficulty,played_at,bf2_maps(sort_order,name)"
        try:
            logs = rest_get(env, f"bf2_game_logs?select={cols},stats_round_id&order=created_at")
            logs_ready = True
        except urllib.error.HTTPError:
            # stats_round_id column not created yet (4_rounds.sql adds it)
            logs = rest_get(env, f"bf2_game_logs?select={cols}&order=created_at")
            for log in logs:
                log["stats_round_id"] = None
            logs_ready = False
        return {"maps": maps, "awards": {a["id"] for a in awards}, "logs": logs, "logs_ready": logs_ready}
    except Exception as err:  # network, auth, missing table...
        warnings.append(f"LIVE DATA UNAVAILABLE ({err}): rounds were NOT processed and award ids were checked "
                        "against the local catalog file only.")
        return None


# ----------------------------------------------------------------------------- profiles

def build_profile(player, kit, weap, veh, army, nemesis, victim):
    p = {k: to_int(v) for k, v in player.items() if k not in ("name", "country", "ip", "clantag")}

    def wsum(keys, kind):
        return sum(to_int(weap[f"{k}{kind}"]) for k in keys)

    # 13 weapon categories in BF2Hub's order: [time, kills, deaths, fired, hit]
    weapons = []
    for i in range(9):
        weapons.append([to_int(weap[f"time{i}"]), to_int(weap[f"kills{i}"]), to_int(weap[f"deaths{i}"]),
                        to_int(weap[f"fired{i}"]), to_int(weap[f"hit{i}"])])

    def special(keys):
        return [wsum(keys, "time"), wsum(keys, "kills"), wsum(keys, "deaths"),
                wsum(keys, "fired"), wsum(keys, "hit")]
    weapons.append(special(["knife"]))                                   # 9 Knife
    weapons.append([to_int(weap["time9"]), to_int(weap["kills9"]), to_int(weap["deaths9"]),
                    to_int(weap["fired9"]), to_int(weap["hit9"])])       # 10 Defibrillator
    weapons.append(special(["c4", "claymore", "atmine", "shockpad"]))    # 11 Explosives
    weapons.append(special(["handgrenade"]))                             # 12 Grenade

    kits = trim_trailing(grouped(kit, ("time", "kills", "deaths"), numbered_count(kit, "time")), MIN_KITS)
    vehicles = trim_trailing(grouped(veh, ("time", "kills", "deaths", "rk"), numbered_count(veh, "time")), MIN_VEHICLES)
    armies = [[i] + r for i, r in enumerate(
        grouped(army, ("time", "win", "loss", "score", "brnd"), numbered_count(army, "time"))) if r[0] > 0]

    return {
        "joined": p["joined"],
        "score": {"total": p["score"], "cmd": p["cmdscore"], "skill": p["skillscore"], "team": p["teamscore"]},
        "time": {"total": p["time"], "cmd": p["cmdtime"], "sql": p["sqltime"], "sqm": p["sqmtime"], "lw": p["lwtime"]},
        "team": {k: p[k] for k in (
            "rounds", "wins", "losses", "captures", "captureassists", "neutralizes", "neutralizeassists",
            "defends", "damageassists", "heals", "revives", "ammos", "repairs", "targetassists",
            "driverspecials", "driverassists", "passengerassists", "teamkills", "teamdamage",
            "teamvehicledamage", "suicides")},
        "combat": {"kills": p["kills"], "deaths": p["deaths"], "killstreak": p["killstreak"],
                   "deathstreak": p["deathstreak"]},
        "kits": kits,
        "vehicles": vehicles,
        "weapons": weapons,
        "armies": armies,
        "nemesis": nemesis,
        "victim": victim,
    }


def collapse_awards(award_rows, valid_players):
    """One row per (player, award). Badges store a source row per tier reached, medals and
    ribbons a single row with a count: keep the highest level, first earned, and when the
    highest level was reached."""
    collapsed = {}
    for pid, awd, level, first, earned in award_rows:
        if pid not in valid_players:
            continue
        level, first, earned = int(level), int(first or 0), int(earned or 0)
        cur = collapsed.setdefault((pid, int(awd)), {"level": 0, "first": 0, "last": 0, "times": []})
        cur["level"] = max(cur["level"], level)
        cur["last"] = max(cur["last"], earned)
        if first:
            cur["first"] = min(cur["first"], first) if cur["first"] else first
        if earned:
            cur["times"].append(earned)
    out = []
    for (pid, awd), c in collapsed.items():
        first = c["first"] or (min(c["times"]) if c["times"] else 0)
        out.append((pid, awd, c["level"], first, c["last"]))
    return out


def known_award_ids_from_file():
    text = open(CATALOG_SQL, encoding="utf-8").read()
    return {int(m.group(1)) for m in re.finditer(r"^\s+\((\d+), '", text, re.M)}


def award_category(award_id):
    """BF2 award ids start with 1 (badge), 2 (medal) or 3 (ribbon)."""
    return {"2": "Medals", "3": "Ribbons"}.get(str(award_id)[0], "Other Badges")


# ----------------------------------------------------------------------------- rounds

def size_for(order, players, flags):
    """Infer the map size a round was played at. flags: sort_order -> (has16, has32, has64)."""
    if order in cfg.URBAN_ORDERS:
        return 32
    if order == cfg.CITY_DISTRICT_ORDER and players > cfg.SMALL_GAME_MAX_PLAYERS:
        return 32
    has = dict(zip((16, 32, 64), flags.get(order, (True, True, True))))
    prefer = (16, 32, 64) if players <= cfg.SMALL_GAME_MAX_PLAYERS else (64, 32, 16)
    return next((s for s in prefer if has[s]), 64)


def plan_rounds(rounds, live_logs, live_maps, forget=()):
    """Decide what to do with each stats round. Pure function (easy to test).

    rounds: dicts with id, local (date), map, p (human players), bots, win
    Returns pairs (link a session you logged by hand), new (insert), and counts to report.
    """
    flags = {m["sort_order"]: (m["supports_16"], m["supports_32"], m["supports_64"]) for m in live_maps}
    known = {log["stats_round_id"] for log in live_logs if log.get("stats_round_id")} - set(forget)
    lo, hi = cfg.PLAYER_RANGE
    unlinked = [log for log in live_logs if not log.get("stats_round_id") or log["stats_round_id"] in forget]

    pairs, new, unmapped = [], [], collections.Counter()
    used = set()
    stats = {"outside_range": 0, "already_imported": 0}

    for r in sorted(rounds, key=lambda r: r["id"]):
        if not lo <= r["p"] <= hi:
            stats["outside_range"] += 1
            continue
        if r["id"] in known:
            stats["already_imported"] += 1
            continue
        order = cfg.MAP_ORDER.get(r["map"])
        if order is None:
            unmapped[r["map"]] += 1
            continue
        result = "win" if r["win"] else "loss"

        candidates = []
        for log in unlinked:
            if log["id"] in used or not log.get("played_at"):
                continue  # undated (spreadsheet) rows are history, never paired with new games
            log_order = (log.get("bf2_maps") or {}).get("sort_order")
            if log_order != order or log["player_count"] != r["p"] or log["result"] != result:
                continue
            days = abs((datetime.date.fromisoformat(log["played_at"]) - r["local"]).days)
            if days <= cfg.PAIR_DAYS:
                candidates.append((days, log["bot_count"] != r["bots"], log["id"], log))
        if candidates:
            log = min(candidates, key=lambda c: c[:3])[3]
            used.add(log["id"])
            pairs.append((log, r))
        else:
            new.append((r, order, size_for(order, r["p"], flags)))

    return {"pairs": pairs, "new": new, "unmapped": unmapped, **stats}


def rounds_sql(plan, source):
    lines = [
        f"-- Rounds from the stats dump {source}.",
        "-- * Rounds matching a session you logged by hand get the real date and a link to the",
        "--   stats round; that session keeps its size, bots and difficulty.",
        "-- * The other 3-8 player rounds are inserted new. Size is inferred (see scripts/bf2stats_config.py),",
        "--   difficulty is left blank: fill it in with Edit in admin.",
        "-- Safe to re-run (each round is linked by stats_round_id and only ever imported once).",
        "",
        "alter table public.bf2_game_logs add column if not exists stats_round_id bigint unique;",
        "",
    ]
    if plan["pairs"]:
        lines.append("-- Link sessions you logged by hand to their real round")
        for log, r in plan["pairs"]:
            lines.append(
                f"update public.bf2_game_logs set played_at = '{r['local']}', stats_round_id = {r['id']}, "
                f"notes = concat_ws(' · ', nullif(notes, ''), 'Linked to stats round #{r['id']}') "
                f"where id = '{log['id']}' and stats_round_id is null;  -- {log['bf2_maps']['name']} "
                f"{r['p']}p {'win' if r['win'] else 'loss'}")
        lines.append("")
    if plan["new"]:
        lines.append("-- New rounds")
        for r, order, size in plan["new"]:
            lines.append(
                "insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, "
                "played_at, notes, stats_round_id) "
                f"values ((select id from public.bf2_maps where sort_order = {order}), {r['p']}, {size}, {r['bots']}, "
                f"'{'win' if r['win'] else 'loss'}', null, '{r['local']}', "
                f"'Imported from stats round #{r['id']} (size assumed)', {r['id']}) "
                f"on conflict (stats_round_id) do nothing;  -- {r['map']}")
    return "\n".join(lines) + "\n"


# ----------------------------------------------------------------------------- schema check

def check_schema(warnings):
    cols = {}
    for table, column in run_sql(
            "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='bf2stats' "
            "ORDER BY TABLE_NAME, ORDINAL_POSITION"):
        cols.setdefault(table, []).append(column)
    if not os.path.exists(BASELINE):
        json.dump(cols, open(BASELINE, "w"), indent=1, sort_keys=True)
        warnings.append("Saved a new column baseline (scripts/bf2stats_known_columns.json). Commit it.")
        return
    known = json.load(open(BASELINE))
    for table in sorted(set(cols) | set(known)):
        if table not in known:
            warnings.append(f"NEW TABLE in the dump: '{table}' ({len(cols[table])} columns). Not imported.")
        elif table not in cols:
            warnings.append(f"Table '{table}' is missing from this dump.")
        else:
            added, removed = sorted(set(cols[table]) - set(known[table])), sorted(set(known[table]) - set(cols[table]))
            if added:
                tag = "USED" if table in USED_TABLES else "unused"
                warnings.append(f"NEW COLUMNS in {tag} table '{table}': {', '.join(added)}. Not imported yet: "
                                "tell Claude what they mean so profiles can show them.")
            if removed:
                warnings.append(f"Columns REMOVED from '{table}': {', '.join(removed)}. Check the import still works.")


# ----------------------------------------------------------------------------- main

def main(data_dir, test_forget_rounds=()):
    if not os.path.isdir(data_dir):
        sys.exit(f"Not a folder: {data_dir}")
    source = os.path.basename(os.path.normpath(data_dir))
    out_dir = os.path.join(IMPORTS_DIR, source)
    warnings = []

    sh("docker", "rm", "-f", CONTAINER, check=False)
    sh("docker", "run", "-d", "--name", CONTAINER, "-e", f"MARIADB_ROOT_PASSWORD={ROOT_PW}", "mariadb:10.11")
    try:
        for _ in range(60):
            if sh("docker", "exec", CONTAINER, "mariadb", "-uroot", f"-p{ROOT_PW}", "-e", "select 1",
                  check=False).returncode == 0:
                break
            time.sleep(2)
        else:
            sys.exit("MariaDB did not start in time. Is Docker running? (open -a Docker)")

        run_sql("CREATE DATABASE bf2stats DEFAULT CHARACTER SET latin1")
        with tempfile.TemporaryDirectory() as tmp:
            for name in os.listdir(data_dir):
                shutil.copy(os.path.join(data_dir, name), tmp)
            sh("docker", "cp", tmp + "/.", f"{CONTAINER}:/var/lib/mysql/bf2stats/")
        sh("docker", "exec", "-u", "root", CONTAINER, "chown", "-R", "mysql:mysql", "/var/lib/mysql/bf2stats")
        run_sql("FLUSH TABLES")

        check_schema(warnings)

        # never select the ip column
        pcols = [c[0] for c in run_sql(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='bf2stats' "
            "AND TABLE_NAME='player' AND COLUMN_NAME <> 'ip' ORDER BY ORDINAL_POSITION")]
        players = select_dicts(
            "SELECT " + ", ".join(f"TRIM(`{c}`) AS `{c}`" if c in ("name", "country") else f"`{c}`" for c in pcols)
            + " FROM bf2stats.player WHERE rounds > 0 ORDER BY score DESC")
        by_id = {p["id"]: p for p in players}
        names = {r[0]: r[1] for r in run_sql("SELECT id, TRIM(name) FROM bf2stats.player")}

        kits = {r["id"]: r for r in select_dicts("SELECT * FROM bf2stats.kits")}
        weaps = {r["id"]: r for r in select_dicts("SELECT * FROM bf2stats.weapons")}
        vehs = {r["id"]: r for r in select_dicts("SELECT * FROM bf2stats.vehicles")}
        armies = {r["id"]: r for r in select_dicts("SELECT * FROM bf2stats.army")}

        top_killer, top_victim = {}, {}
        for attacker, victim, count in run_sql("SELECT attacker, victim, `count` FROM bf2stats.kills"):
            count = int(count)
            if attacker == victim:
                continue
            if count > top_killer.get(victim, (None, 0))[1]:
                top_killer[victim] = (attacker, count)
            if count > top_victim.get(attacker, (None, 0))[1]:
                top_victim[attacker] = (victim, count)

        award_rows = run_sql("SELECT id, awd, level, `first`, earned FROM bf2stats.awards ORDER BY id, awd")
        raw_rounds = run_sql(
            "SELECT r.id, r.timestamp, COALESCE(m.name, CONCAT('mapid_', r.mapid)), r.pids1, r.pids2, "
            "r.tickets1, r.tickets2 FROM bf2stats.round_history r LEFT JOIN bf2stats.mapinfo m ON m.id = r.mapid "
            "ORDER BY r.timestamp")
    finally:
        sh("docker", "rm", "-f", CONTAINER, check=False)

    os.makedirs(out_dir, exist_ok=True)
    for name in os.listdir(out_dir):  # replace any earlier run for this dump
        if re.match(r"[1-4]_.*\.sql$", name) or name == "RUN_ORDER.txt":
            os.remove(os.path.join(out_dir, name))
    written = []

    def write(name, text):
        with open(os.path.join(out_dir, name), "w", encoding="utf-8") as fh:
            fh.write(text)
        written.append(name)

    live = load_live(warnings)

    # ---------------- 1: player standings ----------------
    rows = []
    for p in players:
        last = p["lastonline"]
        rows.append(
            f"  ({p['id']}, {lit(p['name'])}, {p['score']}, {p['rounds']}, {p['wins']}, {p['losses']}, "
            f"{p['kills']}, {p['deaths']}, {p['time']}, "
            f"{lit(p['country'].lower()) if p['country'] else 'null'}, "
            f"{f'to_timestamp({last})' if last not in ('', '0') else 'null'})")
    write("1_players.sql", "\n".join([
        f"-- Player standings from the stats dump {source}.",
        "-- Generated by scripts/bf2stats_to_sql.py; safe to re-run (upserts on external_id).",
        "-- IP addresses are not included.",
        "",
        "insert into public.bf2_players",
        "  (external_id, name, score, rounds, wins, losses, kills, deaths, play_seconds, country, last_online)",
        "values",
        ",\n".join(rows),
        "on conflict (external_id) do update set",
        "  name = excluded.name, score = excluded.score, rounds = excluded.rounds,",
        "  wins = excluded.wins, losses = excluded.losses, kills = excluded.kills,",
        "  deaths = excluded.deaths, play_seconds = excluded.play_seconds,",
        "  country = excluded.country, last_online = excluded.last_online;",
        "",
    ]))

    # ---------------- 2: award ids the catalog doesn't know ----------------
    collapsed = collapse_awards(award_rows, by_id)
    known = live["awards"] if live else known_award_ids_from_file()
    unknown = sorted({awd for _, awd, *_ in collapsed} - known)
    if unknown:
        vals = ",\n".join(f"  ({a}, {lit(f'Unknown award {a}')}, {lit(award_category(a))})" for a in unknown)
        write("2_new_awards.sql", "\n".join([
            "-- Award ids that appear in this dump but not in the award catalog. They get a generic name so",
            "-- players keep the award; give them a real name/requirements/icon later (tell Claude the ids).",
            "",
            "insert into public.bf2_awards (id, name, category, stages, sort_order)",
            "select v.id, v.name, v.category, '[]'::jsonb,",
            "       (select coalesce(max(sort_order), 0) from public.bf2_awards) + row_number() over (order by v.id)",
            "from (values",
            vals,
            ") as v(id, name, category)",
            "on conflict (id) do nothing;",
            "",
        ]))
        warnings.append(f"NEW AWARD IDS not in the catalog: {', '.join(map(str, unknown))}. Placeholder rows are in "
                        "2_new_awards.sql. Ask the user which awards these are and for their icons.")

    # ---------------- 3: profiles + earned awards ----------------
    statements = []
    profiles = []
    for p in players:
        pid = p["id"]
        nem = victim = None
        if pid in top_killer:
            other, count = top_killer[pid]
            nem = {"name": names.get(other, "?"), "count": count}
        if pid in top_victim:
            other, count = top_victim[pid]
            victim = {"name": names.get(other, "?"), "count": count}
        profile = build_profile(p, kits[pid], weaps[pid], vehs[pid], armies[pid], nem, victim)
        profiles.append((pid, json.dumps(profile, separators=(",", ":"), ensure_ascii=False)))
    for start in range(0, len(profiles), CHUNK):
        chunk = profiles[start:start + CHUNK]
        statements.append("\n".join([
            "update public.bf2_players as p set stats = v.stats",
            "from (values",
            ",\n".join(f"  ({pid}::bigint, {lit(js)}::jsonb)" for pid, js in chunk),
            ") as v(external_id, stats)",
            "where p.external_id = v.external_id;",
        ]))
    for start in range(0, len(collapsed), 150):
        vals = []
        for pid, awd, level, first, earned in collapsed[start:start + 150]:
            first_sql = f"to_timestamp({first})" if first else "null::timestamptz"
            earned_sql = f"to_timestamp({earned})" if earned else "null::timestamptz"
            vals.append(f"  ({pid}::bigint, {awd}, {level}, {first_sql}, {earned_sql})")
        statements.append("\n".join([
            "insert into public.bf2_player_awards (player_id, award_id, level, first_earned, last_earned)",
            "select p.id, v.award_id, v.level, v.first_earned, v.last_earned",
            "from (values",
            ",\n".join(vals),
            ") as v(external_id, award_id, level, first_earned, last_earned)",
            "join public.bf2_players p on p.external_id = v.external_id",
            "on conflict (player_id, award_id) do update set",
            "  level = excluded.level, first_earned = excluded.first_earned, last_earned = excluded.last_earned;",
        ]))
    parts, current, size = [], [], 0
    for st in statements:
        if current and size + len(st) > PART_BYTES:
            parts.append(current)
            current, size = [], 0
        current.append(st)
        size += len(st)
    if current:
        parts.append(current)
    for n, part in enumerate(parts, start=1):
        header = [
            f"-- Player profiles and earned awards from {source}, part {n} of {len(parts)}.",
            "-- Generated by scripts/bf2stats_to_sql.py; safe to re-run. Run all parts (any order),",
            "-- after 1_players.sql (and 2_new_awards.sql if it exists).",
            "",
        ]
        write(f"3_profiles_{n}.sql", "\n".join(header) + "\n" + "\n\n".join(part) + "\n")

    # ---------------- 4: rounds ----------------
    round_summary = "skipped (live data unavailable)"
    if live:
        tz = ZoneInfo(cfg.TIMEZONE)
        rounds = []
        for rid, ts, map_name, p1, p2, t1, t2 in raw_rounds:
            local = datetime.datetime.fromtimestamp(int(ts), datetime.timezone.utc).astimezone(tz).date()
            rounds.append({"id": int(rid), "local": local, "map": map_name, "p": int(p1), "bots": int(p2),
                           "win": int(t1) > int(t2)})
        plan = plan_rounds(rounds, live["logs"], live["maps"], forget=set(test_forget_rounds))
        if not live["logs_ready"]:
            warnings.append("The live database has no stats_round_id column yet (4_rounds.sql adds it).")
        if plan["unmapped"]:
            listing = ", ".join(f"{name} ({n})" for name, n in plan["unmapped"].most_common())
            warnings.append(f"UNMAPPED MAPS (rounds skipped): {listing}. Ask the user which site map each one is "
                            "(add the map in admin first if it is new), then add it to MAP_ORDER in "
                            "scripts/bf2stats_config.py and re-run.")
        if plan["pairs"] or plan["new"]:
            write("4_rounds.sql", rounds_sql(plan, source))
        round_summary = (f"{len(plan['new'])} new, {len(plan['pairs'])} linked to sessions you logged, "
                         f"{plan['already_imported']} already imported, {plan['outside_range']} outside "
                         f"{cfg.PLAYER_RANGE[0]}-{cfg.PLAYER_RANGE[1]} players, {sum(plan['unmapped'].values())} unmapped")

    # ---------------- run order + summary ----------------
    summary = [
        f"Stats import from {source}",
        f"  players: {len(players)} | profiles: {len(profiles)} | earned awards: {len(collapsed)} | rounds: {round_summary}",
        "",
        "Run these in the Supabase SQL editor, in this order (safe to re-run):",
        *[f"  {i + 1}. {name}" for i, name in enumerate(written)],
        "",
        "Warnings:" if warnings else "No warnings.",
        *[f"  - {w}" for w in warnings],
    ]
    with open(os.path.join(out_dir, "RUN_ORDER.txt"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(summary) + "\n")
    print("\n".join(summary))
    print(f"\nFiles are in supabase/imports/{source}/")


if __name__ == "__main__":
    args = sys.argv[1:]
    forget = ()
    if "--test-forget-rounds" in args:  # testing aid: pretend these stats round ids were never imported
        i = args.index("--test-forget-rounds")
        forget = tuple(int(x) for x in args[i + 1].split(","))
        del args[i:i + 2]
    if len(args) != 1:
        sys.exit(__doc__)
    main(args[0], forget)
