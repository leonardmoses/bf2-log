#!/usr/bin/env python3
"""Turn a BF2Statistics MySQL dump (.frm/.MYD/.MYI files) into Supabase SQL.

Usage: python3 scripts/bf2stats_to_sql.py data/bf2stats_2026_9-18

Loads a copy of the files into a throwaway MariaDB container (Docker required),
so the originals are never modified, then writes:
  supabase/008_import_players.sql   player standings (score, wins, kills, ...)
  supabase/012_import_profiles_N.sql  full profile stats + earned awards (split into parts)

Player IP addresses are never read or exported. Both files are safe to re-run.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

CONTAINER = "bf2stats_import"
ROOT_PW = "bf2pass"
OUT_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "supabase"))
CHUNK = 30
PART_BYTES = 100_000


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
    cols, body = rows[0], rows[1:]
    return [dict(zip(cols, r)) for r in body]


def lit(value):
    return "'" + value.replace("'", "''") + "'"


def to_int(v):
    return int(v) if v not in ("", "NULL") else 0


def grouped(rec, prefixes, count):
    """[[rec['<p>0'], rec['<p>1'], ...], ...] for each index 0..count-1."""
    return [[to_int(rec[f"{p}{i}"]) for p in prefixes] for i in range(count)]


def build_profile(player, kit, weap, veh, army, nemesis, victim):
    p = {k: to_int(v) for k, v in player.items() if k not in ("name", "country", "ip", "clantag")}

    def wsum(keys, kind):
        return sum(to_int(weap[f"{k}{kind}"]) for k in keys)

    # 13 weapon categories in BF2Hub's order: [time, kills, deaths, fired, hit]
    weapons = []
    for i in range(9):
        weapons.append([to_int(weap[f"time{i}"]), to_int(weap[f"kills{i}"]), to_int(weap[f"deaths{i}"]),
                        to_int(weap[f"fired{i}"]), to_int(weap[f"hit{i}"])])
    def special(keys, dead_keys=None):
        dead_keys = dead_keys if dead_keys is not None else keys
        return [wsum(keys, "time"), wsum(keys, "kills"), wsum(dead_keys, "deaths"),
                wsum(keys, "fired"), wsum(keys, "hit")]
    weapons.append(special(["knife"]))                                   # 9 Knife
    weapons.append([to_int(weap["time9"]), to_int(weap["kills9"]), to_int(weap["deaths9"]),
                    to_int(weap["fired9"]), to_int(weap["hit9"])])       # 10 Defibrillator
    weapons.append(special(["c4", "claymore", "atmine", "shockpad"]))    # 11 Explosives
    weapons.append(special(["handgrenade"]))                             # 12 Grenade

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
        "kits": [r for r in grouped(kit, ("time", "kills", "deaths"), 7)],
        "vehicles": [r for r in grouped(veh, ("time", "kills", "deaths", "rk"), 6)],
        "weapons": weapons,
        "armies": [[i] + r for i, r in enumerate(grouped(army, ("time", "win", "loss", "score", "brnd"), 21)) if r[0] > 0],
        "nemesis": nemesis,
        "victim": victim,
    }


def main(data_dir):
    if not os.path.isdir(data_dir):
        sys.exit(f"Not a folder: {data_dir}")

    sh("docker", "rm", "-f", CONTAINER, check=False)
    sh("docker", "run", "-d", "--name", CONTAINER,
       "-e", f"MARIADB_ROOT_PASSWORD={ROOT_PW}", "mariadb:10.11")
    try:
        for _ in range(60):
            if sh("docker", "exec", CONTAINER, "mariadb", "-uroot", f"-p{ROOT_PW}",
                  "-e", "select 1", check=False).returncode == 0:
                break
            time.sleep(2)
        else:
            sys.exit("MariaDB did not start in time.")

        run_sql("CREATE DATABASE bf2stats DEFAULT CHARACTER SET latin1")
        with tempfile.TemporaryDirectory() as tmp:
            for name in os.listdir(data_dir):
                shutil.copy(os.path.join(data_dir, name), tmp)
            sh("docker", "cp", tmp + "/.", f"{CONTAINER}:/var/lib/mysql/bf2stats/")
        sh("docker", "exec", "-u", "root", CONTAINER, "chown", "-R", "mysql:mysql",
           "/var/lib/mysql/bf2stats")
        run_sql("FLUSH TABLES")

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
    finally:
        sh("docker", "rm", "-f", CONTAINER, check=False)

    # ---------------- 008: player standings ----------------
    lines = [
        "-- Player standings imported from a BF2Statistics database dump.",
        f"-- Source folder: {os.path.basename(os.path.normpath(data_dir))}",
        "-- Generated by scripts/bf2stats_to_sql.py; safe to re-run (upserts on external_id).",
        "-- Run after 007_players.sql. IP addresses are not included.",
        "",
        "insert into public.bf2_players",
        "  (external_id, name, score, rounds, wins, losses, kills, deaths, play_seconds, country, last_online)",
        "values",
    ]
    rows = []
    for p in players:
        last = p["lastonline"]
        last_sql = f"to_timestamp({last})" if last not in ("", "0") else "null"
        country_sql = lit(p["country"].lower()) if p["country"] else "null"
        rows.append(
            f"  ({p['id']}, {lit(p['name'])}, {p['score']}, {p['rounds']}, {p['wins']}, {p['losses']}, "
            f"{p['kills']}, {p['deaths']}, {p['time']}, {country_sql}, {last_sql})")
    lines.append(",\n".join(rows))
    lines += [
        "on conflict (external_id) do update set",
        "  name = excluded.name, score = excluded.score, rounds = excluded.rounds,",
        "  wins = excluded.wins, losses = excluded.losses, kills = excluded.kills,",
        "  deaths = excluded.deaths, play_seconds = excluded.play_seconds,",
        "  country = excluded.country, last_online = excluded.last_online;",
        "",
    ]
    with open(os.path.join(OUT_DIR, "008_import_players.sql"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    # ---------------- 012: profiles + awards (split into pasteable parts) ----------------
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

    statements = []
    for start in range(0, len(profiles), CHUNK):
        chunk = profiles[start:start + CHUNK]
        statements.append("\n".join([
            "update public.bf2_players as p set stats = v.stats",
            "from (values",
            ",\n".join(f"  ({pid}::bigint, {lit(js)}::jsonb)" for pid, js in chunk),
            ") as v(external_id, stats)",
            "where p.external_id = v.external_id;",
        ]))

    # Badges store one source row per tier reached (Basic/Veteran/Expert), medals and
    # ribbons a single row with a count. Collapse to one row per player and award:
    # highest level, first earned, and when the highest level was reached.
    collapsed = {}
    for pid, awd, level, first, earned in award_rows:
        if pid not in by_id:
            continue
        level, first, earned = int(level), int(first or 0), int(earned or 0)
        cur = collapsed.setdefault((pid, awd), {"level": 0, "first": 0, "last": 0, "times": []})
        cur["level"] = max(cur["level"], level)
        cur["last"] = max(cur["last"], earned)
        if first:
            cur["first"] = min(cur["first"], first) if cur["first"] else first
        if earned:
            cur["times"].append(earned)
    kept = []
    for (pid, awd), c in collapsed.items():
        first = c["first"] or (min(c["times"]) if c["times"] else 0)
        kept.append((pid, awd, str(c["level"]), str(first), str(c["last"])))
    for start in range(0, len(kept), 150):
        chunk = kept[start:start + 150]
        vals = []
        for pid, awd, level, first, earned in chunk:
            first_sql = f"to_timestamp({first})" if first not in ("", "0") else "null::timestamptz"
            earned_sql = f"to_timestamp({earned})" if earned not in ("", "0") else "null::timestamptz"
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

    # remove parts from any earlier run, then write fresh ones
    for name in os.listdir(OUT_DIR):
        if name.startswith("012_import_profiles"):
            os.remove(os.path.join(OUT_DIR, name))

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
            f"-- Player profiles and earned awards, part {n} of {len(parts)}.",
            "-- Imported from a BF2Statistics database dump.",
            f"-- Source folder: {os.path.basename(os.path.normpath(data_dir))}",
            "-- Generated by scripts/bf2stats_to_sql.py; safe to re-run.",
            "-- Run after 008_import_players.sql, 010_profiles.sql and 011_awards_catalog.sql;",
            "-- run all parts (any order).",
            "",
        ]
        with open(os.path.join(OUT_DIR, f"012_import_profiles_{n}.sql"), "w", encoding="utf-8") as fh:
            fh.write("\n".join(header) + "\n\n".join(part) + "\n")

    print(f"Wrote {len(players)} players to 008_import_players.sql")
    print(f"Wrote {len(profiles)} profiles and {len(kept)} earned awards across {len(parts)} file(s): 012_import_profiles_1..{len(parts)}.sql")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
