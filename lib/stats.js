export const PLAYER_COUNTS = [3, 4, 5, 6, 7, 8];
export const MAP_SIZES = [16, 32, 64];

export function defaultBotCount(playerCount) {
  return Number(playerCount) * 10;
}

const SUPPORTS_FIELD = { 16: 'supports_16', 32: 'supports_32', 64: 'supports_64' };

export function mapSupportsSize(map, size) {
  const field = SUPPORTS_FIELD[size];
  return field ? map?.[field] !== false : true;
}

export function supportedSizesForMap(map) {
  return MAP_SIZES.filter((size) => mapSupportsSize(map, size));
}

export function summarizeLogs(logs) {
  const wins = logs.filter((l) => l.result === 'win').length;
  const losses = logs.filter((l) => l.result === 'loss').length;
  const difficulties = logs.map((l) => l.difficulty).filter((d) => d != null);
  const avgDifficulty = difficulties.length
    ? difficulties.reduce((a, b) => a + b, 0) / difficulties.length
    : null;

  // Newest first; undated sessions count as oldest, ties fall back to when they were logged.
  const stamp = (l) => (l.played_at ? new Date(l.played_at).getTime() : -Infinity);
  const sorted = [...logs].sort(
    (a, b) =>
      stamp(b) - stamp(a) ||
      String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))
  );
  const latest = sorted[0];

  // Highest bot count for a result, with when it was played. Ties go to the newest session
  // (`sorted` is newest first, so the first match wins).
  const topBots = (result) => {
    let best = null;
    for (const l of sorted) {
      if (l.result === result && l.bot_count != null && (!best || l.bot_count > best.bot_count)) best = l;
    }
    return best
      ? { bots: best.bot_count, playedAt: best.played_at ?? null, players: best.players ?? null }
      : null;
  };
  const topWin = topBots('win');
  const topLoss = topBots('loss');
  const botsMaxWin = topWin?.bots ?? null;
  const botsMaxLoss = topLoss?.bots ?? null;

  return {
    count: logs.length,
    wins,
    losses,
    avgDifficulty,
    botsMaxWin,
    botsMaxLoss,
    topWin,
    topLoss,
    // shown in the table: the most bots beaten, or if never won, the most bots attempted
    botsShown: botsMaxWin ?? botsMaxLoss,
    // newest first; every individual round in this map/size/player-count bucket, for the
    // "view rounds" list when a cell is clicked
    rounds: sorted,
    latest: latest
      ? {
          bots: latest.bot_count ?? null,
          result: latest.result,
          playedAt: latest.played_at ?? null,
          players: latest.players ?? null,
        }
      : null,
    lastPlayedAt: sorted.find((l) => l.played_at)?.played_at ?? null,
  };
}

// Builds: stats[mapId][playerCount][mapSize] = summary
export function buildStatsIndex(logs) {
  const index = {};
  for (const log of logs) {
    index[log.map_id] ??= {};
    index[log.map_id][log.player_count] ??= {};
    index[log.map_id][log.player_count][log.map_size] ??= [];
    index[log.map_id][log.player_count][log.map_size].push(log);
  }
  const summarized = {};
  for (const mapId of Object.keys(index)) {
    summarized[mapId] = {};
    for (const playerCount of Object.keys(index[mapId])) {
      summarized[mapId][playerCount] = {};
      for (const size of Object.keys(index[mapId][playerCount])) {
        summarized[mapId][playerCount][size] = summarizeLogs(
          index[mapId][playerCount][size]
        );
      }
    }
  }
  return summarized;
}
