@AGENTS.md


# BF2 Log runbook

Weekly Battlefield 2 co-op night tracker. Next.js (JavaScript, App Router, no Tailwind) + Supabase; deployed on Vercel from `main`. Public reads, single admin writes.

## Processing a new stats dump ("process it")

The user drops a dated BF2Statistics folder (`.frm/.MYD/.MYI`) in `data/`, e.g. `data/bf2stats_2026_9-18`. `data/` and `design/` are gitignored, local only. Never export player IP addresses.

1. Docker Desktop must be running (`open -a Docker` and wait). The script uses a throwaway MariaDB container and removes it.
2. `python3 scripts/bf2stats_to_sql.py data/<folder>` writes `supabase/imports/<folder>/`: `1_players.sql`, `2_new_awards.sql` (only if the dump has award ids missing from the catalog), `3_profiles_N.sql`, `4_rounds.sql` (new/paired rounds, plus round duration -- written whenever any round has a log row, needs `supabase/019_round_duration.sql`), `5_session_players.sql` (the human players in each session, needs `supabase/016_session_players.sql`), `6_round_players.sql` (per-round score/kills/deaths/time for every player, humans and bots, needs `supabase/017_round_players.sql`; powers the round detail page at `/rounds/[id]`), `0_all.sql` (every numbered file above concatenated, wrapped in one transaction -- optional, for pasting everything in one go instead of one file at a time), and `RUN_ORDER.txt`. It reads the live maps, sessions and award catalog through the public REST API (`.env.local` anon key). Steps 4-6 backfill every round that has a log row, not just new ones this run, so a dump's full history (as far back as the dump retains `player_history`) can be filled in during a single pass.
3. `python3 scripts/validate_imports.py supabase/imports/<folder>` runs the files twice in a throwaway Postgres 16 container. Do this before handing SQL over.
4. Read the script's warnings and act on them:
   - **UNMAPPED MAPS**: ask the user which site map it is (add it in admin first if new), then add it to `MAP_ORDER` in `scripts/bf2stats_config.py` and re-run.
   - **NEW AWARD IDS**: placeholder catalog rows are generated so nothing breaks. Ask the user what they are, and for icons (then `python3 scripts/match_award_icons.py`).
   - **NEW COLUMNS / TABLES**: the dump has stats we don't import. Ask what they mean, extend `build_profile` and the profile UI, then update `scripts/bf2stats_known_columns.json`.
5. Tell the user which files to paste into the Supabase SQL editor, in `RUN_ORDER.txt` order (each part is a separate paste). Everything is idempotent. The user runs the SQL themselves; do not use the connected Supabase MCP tools, which point at an unrelated project.
6. Newly imported rounds have blank difficulty and an inferred size; remind the user to fill difficulty in admin. Rounds matching a hand-entered session (same map, players, result, within 2 days) are linked instead of duplicated.
7. **Difficulty is never overwritten by a later import.** New rounds are `insert ... on conflict (stats_round_id) do nothing`, so re-running (or a later week's dump touching the same round again) is a no-op on an existing row. The only two `update`s that ever touch `bf2_game_logs` set `played_at`/`stats_round_id`/`notes` (guarded by `stats_round_id is null`, so it fires once) and `duration_seconds` -- neither one's `set` clause mentions `difficulty`. Verified in a throwaway database: import a round, set its difficulty by hand, re-run the same `4_rounds.sql`, difficulty is unchanged. Keep it this way in any future edit to `rounds_sql()`.

Humans vs bots: the stats DB has no bot flag. Bots connect from the loopback address, remote humans have a real one, and the host account (Qalexeon, in `HOST_PLAYER_IDS`) is listed explicitly. Each human's end-of-round record is matched to the nearest round end (round timestamps are on a coarse grid). The address is only used inside the query to classify, never exported.

Import rules live in `scripts/bf2stats_config.py`: US Eastern dates, only 3-8 human players, size inference (3-4 players smallest size the map has, 5-8 players 64, Urban Decay/Urban Jungle 32, City District 5-6p 32). Round win = `tickets1 > tickets2`; team 1 = humans, team 2 = bots. Kits/vehicles beyond the standard 7/6 are imported automatically and shown as `Kit N`/`Vehicle N` until named in `lib/profile.js`.

Per-round player results (`bf2_round_players`, one row per player per round, humans and bots): the stats DB's `player_history` table turns out to be a per-round snapshot, not a running total (verified against career totals in `player`) -- one row per round a player was in, each row's `time`/`score`/`kills`/`deaths` covering just that round. Matched to a round the same way as session players (nearest round end, coarse-grid timestamps). Not available per round: assists, captures, heals, revives, kit/weapon/vehicle breakdown -- those only exist as career totals in the raw dump, never broken out by round.

Clicking a played map-table cell (`components/CellHover.js`'s `onOpen`) opens `RoundsModal`, listing every round behind that cell (from `summary.rounds`, already loaded client-side -- no extra fetch), each linking to `/rounds/[id]` (`app/rounds/[id]/page.js`), which reads `bf2_game_logs` + `bf2_round_players` for that log row. Bots are included in the data but hidden behind a "Show bot performance" disclosure by default.

## Who is admin

Anyone can sign up (Supabase signups are on) but only the emails in `ADMIN_EMAILS` (`lib/admin.js`) can change stats. The same list is hardcoded in `is_admin()` in `supabase/013_admin_only_writes.sql`, which every write policy uses, and requires a confirmed email. Adding an admin means editing BOTH places and re-running the SQL. New tables need write policies that use `public.is_admin()`, never plain `to authenticated`. Server actions that write must call `requireAdminClient()`.

## Working agreements

- Commit and push only when the user explicitly says so, and honor any exclusions they name. Never commit `.env.local`, the service-role key or `ADMIN_SIGNUP_CODE`.
- Verify UI changes in a real browser (Playwright is fine), then stop any dev server or Docker container you started.
- CSS: write `backdrop-filter` once, with no manual `-webkit-` duplicate (Next's CSS build drops the standard property). Nested backdrop-filters do not blur the page, so keep the modal scrim and panel as siblings.
- Tailwind CSS v4 is available alongside the hand-written CSS (set up in `app/globals.css` + `postcss.config.mjs`). Preflight (the Tailwind reset) is deliberately NOT imported so existing pages don't change, and the hand-written styles sit inside `@layer components` so Tailwind utilities win over them. Sources scanned: `app/`, `components/`, `lib/`. A new dev server must be restarted after config changes. The project is JavaScript, not TypeScript.
- Icon paths in `public/images/awards/` can contain odd characters: encode each path segment with `encodeURIComponent`.
