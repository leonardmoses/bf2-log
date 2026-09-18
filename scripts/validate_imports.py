#!/usr/bin/env python3
"""Check generated import SQL against a throwaway Postgres (Docker), the way Supabase will run it.

Usage: python3 scripts/validate_imports.py supabase/imports/bf2stats_2026_9-18

Applies schema.sql and the numbered migrations (supabase/0*.sql) to an empty database,
then runs the folder's 1_/2_/3_/4_ files TWICE (imports must be safe to re-run) and
prints row counts. Any SQL error stops the run and is printed.
"""
import glob
import os
import subprocess
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
NAME = "bf2_validate_pg"


def sh(*a, check=True, **kw):
    return subprocess.run(a, check=check, capture_output=True, text=True, **kw)


def psql(sql=None, path=None):
    cmd = ["docker", "exec", "-i", NAME, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-qAt"]
    if sql is not None:
        cmd += ["-c", sql]
        return sh(*cmd)
    with open(path, encoding="utf-8") as fh:
        return subprocess.run(cmd, stdin=fh, capture_output=True, text=True)


def main(folder):
    files = sorted(f for f in glob.glob(os.path.join(folder, "*.sql")) if os.path.basename(f)[0] in "1234")
    if not files:
        sys.exit("No 1_/2_/3_/4_ .sql files in that folder.")
    sh("docker", "rm", "-f", NAME, check=False)
    sh("docker", "run", "-d", "--name", NAME, "-e", "POSTGRES_PASSWORD=x", "postgres:16")
    try:
        for _ in range(30):
            if sh("docker", "exec", NAME, "pg_isready", "-U", "postgres", check=False).returncode == 0:
                time.sleep(2)
                break
            time.sleep(1)
        # stand-ins for Supabase's roles/schema so the policies in schema.sql can be created
        psql("create role anon; create role authenticated; create schema if not exists auth;"
             "create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, email_confirmed_at timestamptz);"
             "create or replace function auth.uid() returns uuid language sql as $$ select null::uuid $$;"
             "create or replace function auth.role() returns text language sql as $$ select 'anon'::text $$;")
        setup = [os.path.join(ROOT, "supabase", "schema.sql")] + sorted(glob.glob(os.path.join(ROOT, "supabase", "0*.sql")))
        for path in setup:
            r = psql(path=path)
            if r.returncode:
                sys.exit(f"MIGRATION FAILED {os.path.basename(path)}:\n{r.stderr}")
        for attempt in (1, 2):
            for path in files:
                r = psql(path=path)
                if r.returncode:
                    sys.exit(f"FAILED (run {attempt}) {os.path.basename(path)}:\n{r.stderr[:1500]}")
            counts = psql("select (select count(*) from bf2_players), (select count(*) from bf2_players where stats is not null),"
                          " (select count(*) from bf2_player_awards), (select count(*) from bf2_awards),"
                          " (select count(*) from bf2_game_logs)").stdout.strip()
            print(f"run {attempt}: players | with profile | earned awards | catalog | logs = {counts}")
        print("OK: every file ran twice without errors")
    finally:
        sh("docker", "rm", "-f", NAME, check=False)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
