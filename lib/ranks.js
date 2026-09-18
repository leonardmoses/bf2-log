// Rank table from https://www.bf2hub.com/ranks/ (index matches public/images/ranks/rank_<index>.png).
export const RANKS = [
  { index: 0, name: 'Private', abbr: 'Pvt', score: 0 },
  { index: 1, name: 'Private First Class', abbr: 'PFC', score: 150 },
  { index: 2, name: 'Lance Corporal', abbr: 'LCpl', score: 500 },
  { index: 3, name: 'Corporal', abbr: 'Cpl', score: 800 },
  { index: 4, name: 'Sergeant', abbr: 'Sgt', score: 2500 },
  { index: 5, name: 'Staff Sergeant', abbr: 'SSgt', score: 5000 },
  { index: 6, name: 'Gunnery Sergeant', abbr: 'GySgt', score: 8000 },
  { index: 7, name: 'Master Sergeant', abbr: 'MSgt', score: 20000 },
  { index: 8, name: 'First Sergeant', abbr: '1stSgt', score: 20000 },
  { index: 9, name: 'Master Gunnery Sergeant', abbr: 'MGySgt', score: 50000 },
  { index: 10, name: 'Sergeant Major', abbr: 'SgtMaj', score: 50000 },
  { index: 11, name: 'Sergeant Major of the Corps', abbr: 'SgtMajC', score: 50000 },
  { index: 12, name: 'Second Lieutenant', abbr: '2ndLt', score: 60000 },
  { index: 13, name: 'First Lieutenant', abbr: '1stLt', score: 75000 },
  { index: 14, name: 'Captain', abbr: 'Cpt', score: 90000 },
  { index: 15, name: 'Major', abbr: 'Maj', score: 115000 },
  { index: 16, name: 'Lieutenant Colonel', abbr: 'LtCol', score: 125000 },
  { index: 17, name: 'Colonel', abbr: 'Col', score: 150000 },
  { index: 18, name: 'Brigadier General', abbr: 'BGen', score: 180000 },
  { index: 19, name: 'Major General', abbr: 'MajGen', score: 180000 },
  { index: 20, name: 'Lieutenant General', abbr: 'LtGen', score: 200000 },
  { index: 21, name: 'General', abbr: 'Gen', score: 200000 },
];

// Ranks 8, 10, 11, 19 and 21 also need badges, play time or a monthly
// standing, so score alone can never select them; use rank_override.
const SCORE_ONLY = [0, 1, 2, 3, 4, 5, 6, 7, 9, 12, 13, 14, 15, 16, 17, 18, 20];

export function rankForPlayer(player) {
  if (player.rank_override != null) {
    return RANKS[player.rank_override];
  }
  let rank = RANKS[0];
  for (const index of SCORE_ONLY) {
    if (player.score >= RANKS[index].score) rank = RANKS[index];
  }
  return rank;
}

export function rankBadgeSrc(rank) {
  return `/images/ranks/rank_${rank.index}.png`;
}
