import { AWARD_ICON_FILES } from '@/lib/awardIcons';

export const KIT_NAMES = ['Anti-Tank', 'Assault', 'Engineer', 'Medic', 'Spec-Ops', 'Support', 'Sniper'];
export const VEHICLE_NAMES = ['Armor', 'Jet', 'Helicopter', 'Transport', 'Anti-Air', 'Ground-Def.', 'Parachute'];
export const WEAPON_NAMES = [
  'Assault-Rifle', 'Grenade-Launcher', 'Carbine', 'Light Machine Gun', 'Sniper Rifle', 'Pistol',
  'Anti-Tank', 'Sub-Machine Gun', 'Shotgun', 'Knife', 'Defibrillator', 'Explosives', 'Grenade',
];
const ARMY_NAMES = ['USMC', 'MEC', 'PLA', 'Seals', 'SAS', 'Spetsnaz', 'MEC SF', 'Rebels', 'Insurgents', 'EU'];

export const armyName = (index) => ARMY_NAMES[index] ?? `Army ${index}`;
// New kit / vehicle / weapon slots can appear in later stats dumps; show a generic label until named.
export const kitName = (index) => KIT_NAMES[index] ?? `Kit ${index}`;
export const vehicleName = (index) => VEHICLE_NAMES[index] ?? `Vehicle ${index}`;
export const weaponName = (index) => WEAPON_NAMES[index] ?? `Weapon ${index}`;

export const AWARD_GROUPS = [
  { key: 'Medals', title: 'Medals' },
  { key: 'Ribbons', title: 'Ribbons' },
  { key: 'Badges', title: 'Badges' },
  { key: 'Other Badges', title: 'Other Badges' },
];

export const TIER_NAMES = { 1: 'Basic', 2: 'Veteran', 3: 'Expert' };

export const isBadge = (category) => category === 'Badges' || category === 'Other Badges';

export function formatNumber(n) {
  return Number(n ?? 0).toLocaleString('en-US');
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function formatHours(seconds) {
  const h = (Number(seconds) || 0) / 3600;
  return h >= 100 ? Math.round(h).toLocaleString('en-US') : h.toFixed(1);
}

export function ratio(a, b) {
  const x = Number(a) || 0;
  const y = Number(b) || 0;
  return (y > 0 ? x / y : x).toFixed(2);
}

export function percent(part, whole, digits = 1) {
  const w = Number(whole) || 0;
  return w > 0 ? `${(((Number(part) || 0) / w) * 100).toFixed(digits)}%` : '0.0%';
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    timeZone: 'America/New_York',
  });
}

// Formats a plain "YYYY-MM-DD" date (no time), like bf2_game_logs.played_at, without
// shifting the calendar day -- reads the y/m/d parts directly and builds a local date,
// instead of letting the string parse as UTC-midnight and then display in America/New_York
// (which can show the wrong day for a date-only value). Used for the "highest at a
// win/loss/most recent" dates on the map table's hover card and rounds modal.
export function formatDayOnly(iso) {
  if (!iso) return 'date unknown';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function flagEmoji(code) {
  if (!code || code.length !== 2) return '';
  const iso = code.toLowerCase() === 'uk' ? 'GB' : code.toUpperCase();
  return String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function playerHref(player) {
  return `/players/${player.external_id ?? player.id}`;
}

// Icon URLs to try for an award, best first: the file matched by
// scripts/match_award_icons.py (badges have one per tier, so pick the player's tier),
// then plain <id> files (badges: <id>_<level>).
export function awardIconSources(award, level) {
  const base = `/images/awards/${award.id}`;
  const matched = AWARD_ICON_FILES[award.id];
  const sources = [];

  if (matched) {
    const files = typeof matched === 'string' ? [matched] : [matched[level], matched[1], matched[2], matched[3]];
    for (const file of files) {
      if (!file) continue;
      // encode each path segment so names containing %, spaces or apostrophes still resolve
      const url = `/images/awards/${file.split('/').map(encodeURIComponent).join('/')}`;
      if (!sources.includes(url)) sources.push(url);
    }
  }
  if (isBadge(award.category) && level) {
    sources.push(`${base}_${level}.png`, `${base}_${level}.webp`);
  }
  sources.push(`${base}.png`, `${base}.webp`);
  return sources;
}

// Derived numbers for a player's profile page.
export function summarizeProfile(stats) {
  const kits = stats.kits ?? [];
  const vehicles = stats.vehicles ?? [];
  const weapons = stats.weapons ?? [];
  const armies = stats.armies ?? [];

  const fired = weapons.reduce((sum, w, i) => (i === 10 ? sum : sum + w[3]), 0);
  const hit = weapons.reduce((sum, w, i) => (i === 10 ? sum : sum + w[4]), 0);

  const top = (rows, timeIndex = 0) => {
    let best = -1;
    rows.forEach((row, i) => {
      if (row[timeIndex] > 0 && (best === -1 || row[timeIndex] > rows[best][timeIndex])) best = i;
    });
    return best;
  };
  const topArmy = armies.reduce((best, a) => (!best || a[1] > best[1] ? a : best), null);

  return {
    accuracy: fired > 0 ? (hit / fired) * 100 : 0,
    favKit: top(kits),
    favVehicle: top(vehicles),
    favWeapon: top(weapons.slice(0, 9)),
    favArmy: topArmy ? topArmy[0] : -1,
  };
}
