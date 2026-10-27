"""Docker-free fallback for the import scripts (Windows PC without Docker).

When `docker` isn't on PATH, bf2stats_to_sql.py and validate_imports.py start a throwaway
local MariaDB 10.11 / Postgres 16 server instead, from portable zip builds unpacked in
BF2_TOOLS_DIR (default %LOCALAPPDATA%/bf2-log-tools/x, outside Dropbox):

  <tools>/mariadb-10.11.*-winx64/   from archive.mariadb.org (winx64-packages zip)
  <tools>/pgsql/                    from get.enterprisedb.com (windows-x64-binaries zip)

Each server gets a fresh temporary data folder that is deleted afterwards, same as the
Docker containers, so the dump files themselves are never modified.
"""
import contextlib
import glob
import os
import shutil
import subprocess
import tempfile
import time

TOOLS = os.environ.get("BF2_TOOLS_DIR") or os.path.join(os.environ.get("LOCALAPPDATA", ""), "bf2-log-tools", "x")
MARIADB_PORT, PG_PORT = 33306, 54329


def use_docker():
    return shutil.which("docker") is not None


def _bin(pattern, exe):
    hits = sorted(glob.glob(os.path.join(TOOLS, pattern, "bin", exe)))
    if not hits:
        raise SystemExit(f"Docker isn't installed and no portable {exe} was found under {TOOLS} "
                         "(see scripts/local_db.py).")
    return hits[-1]


def _run(*args, check=True):
    return subprocess.run(args, check=check, capture_output=True, text=True)


@contextlib.contextmanager
def mariadb(root_pw):
    """Yields (client_cmd_prefix, datadir). Copy table files into datadir/<db>/ then FLUSH TABLES."""
    server = _bin("mariadb-10.11*", "mariadbd.exe")
    bindir = os.path.dirname(server)
    tmp = tempfile.mkdtemp(prefix="bf2_mariadb_")
    datadir = os.path.join(tmp, "data")
    _run(os.path.join(bindir, "mariadb-install-db.exe"), f"--datadir={datadir}", f"--password={root_pw}")
    proc = subprocess.Popen([server, f"--datadir={datadir}", f"--port={MARIADB_PORT}", "--bind-address=127.0.0.1",
                             "--console"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    client = [os.path.join(bindir, "mariadb.exe"), "-h127.0.0.1", f"-P{MARIADB_PORT}", "-uroot", f"-p{root_pw}"]
    try:
        for _ in range(60):
            if _run(*client, "-e", "select 1", check=False).returncode == 0:
                break
            time.sleep(1)
        else:
            raise SystemExit("Local MariaDB did not start in time.")
        yield client, datadir
    finally:
        _run(os.path.join(bindir, "mariadb-admin.exe"), *client[1:], "shutdown", check=False)
        try:
            proc.wait(timeout=30)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
        shutil.rmtree(tmp, ignore_errors=True)


@contextlib.contextmanager
def postgres():
    """Yields the psql command prefix for a throwaway local Postgres (user postgres, trust auth)."""
    bindir = os.path.dirname(_bin("pgsql", "postgres.exe"))
    tmp = tempfile.mkdtemp(prefix="bf2_pg_")
    datadir = os.path.join(tmp, "data")
    _run(os.path.join(bindir, "initdb.exe"), "-D", datadir, "-U", "postgres", "-A", "trust", "-E", "UTF8",
         "--no-locale")
    pg_ctl = os.path.join(bindir, "pg_ctl.exe")
    # not _run: the server inherits pg_ctl's handles, so captured pipes would never close
    subprocess.run([pg_ctl, "-D", datadir, "-l", os.path.join(tmp, "log.txt"), "-o",
                    f"-p {PG_PORT} -c listen_addresses=127.0.0.1", "-w", "start"],
                   check=True, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        yield [os.path.join(bindir, "psql.exe"), "-h", "127.0.0.1", "-p", str(PG_PORT), "-U", "postgres"]
    finally:
        _run(pg_ctl, "-D", datadir, "-m", "immediate", "-w", "stop", check=False)
        shutil.rmtree(tmp, ignore_errors=True)
