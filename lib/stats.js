export const PLAYER_COUNTS = [3, 4, 5, 6];
export const MAP_SIZES = [16, 32, 64];

export function defaultBotCount(playerCount) {
  return Number(playerCount) * 10;
}

export function summarizeLogs(logs) {
  const wins = logs.filter((l) => l.result === 'win').length;
  const losses = logs.filter((l) => l.result === 'loss').length;
  const difficulties = logs.map((l) => l.difficulty).filter((d) => d != null);
  const avgDifficulty = difficulties.length
    ? difficulties.reduce((a, b) => a + b, 0) / difficulties.length
    : null;
  const sorted = [...logs].sort(
    (a, b) => new Date(b.played_at) - new Date(a.played_at)
  );
  return {
    count: logs.length,
    wins,
    losses,
    avgDifficulty,
    lastBotCount: sorted[0]?.bot_count ?? null,
    lastPlayedAt: sorted[0]?.played_at ?? null,
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
