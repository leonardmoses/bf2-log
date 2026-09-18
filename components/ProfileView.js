import Link from 'next/link';
import RankBadge from '@/components/RankBadge';
import ProfileAwards from '@/components/ProfileAwards';
import { nextRank, rankForPlayer } from '@/lib/ranks';
import {
  kitName,
  vehicleName,
  weaponName,
  armyName,
  flagEmoji,
  formatDate,
  formatDuration,
  formatHours,
  formatNumber,
  percent,
  ratio,
  summarizeProfile,
} from '@/lib/profile';

function KeyValues({ rows }) {
  return (
    <div className="kv">
      {rows.map(([label, value], i) =>
        value === undefined ? (
          <div className="kv-head" key={`${label}-${i}`}>
            {label}
          </div>
        ) : (
          <div className="kv-row" key={`${label}-${i}`}>
            <span className="kv-label">{label}</span>
            <span className="kv-value">{value}</span>
          </div>
        )
      )}
    </div>
  );
}

function InfoBox({ title, note, children }) {
  return (
    <div className="standings">
      <div className="bar-header">
        <span className="bar-header-title">{title}</span>
        {note && <span className="bar-header-note">{note}</span>}
      </div>
      {children}
    </div>
  );
}

function DataTable({ title, columns, rows }) {
  return (
    <div className="profile-table">
      <h2 className="profile-table-title">{title}</h2>
      <div className="table-wrap">
        <table className="stats-table profile-stats-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c} className={i === 0 ? '' : 'num'}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} className={i === 0 ? 'map-name' : 'num'}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProfileView({ player, catalog, earned, awardsMissing }) {
  const rank = rankForPlayer(player);
  const stats = player.stats;
  const derived = stats ? summarizeProfile(stats) : null;

  const kills = stats?.combat.kills ?? player.kills ?? 0;
  const deaths = stats?.combat.deaths ?? player.deaths ?? 0;
  const wins = stats?.team.wins ?? player.wins ?? 0;
  const losses = stats?.team.losses ?? player.losses ?? 0;
  const rounds = stats?.team.rounds ?? player.rounds ?? 0;
  const seconds = stats?.time.total ?? player.play_seconds ?? 0;
  const minutes = seconds / 60;

  const cards = [
    {
      title: 'Score',
      value: formatNumber(player.score),
      unit: 'pts',
      note: stats
        ? `Teamwork ${formatNumber(stats.score.team)} · Combat ${formatNumber(stats.score.skill)} · Cmd ${formatNumber(stats.score.cmd)}`
        : 'Total score',
    },
    { title: 'Kill / Death', value: ratio(kills, deaths), unit: 'K/D', note: `${formatNumber(kills)} kills · ${formatNumber(deaths)} deaths` },
    { title: 'Win / Loss', value: ratio(wins, losses), unit: 'W/L', note: `${formatNumber(wins)} wins · ${formatNumber(losses)} losses` },
    { title: 'Time played', value: formatHours(seconds), unit: 'hours', note: `${formatNumber(rounds)} rounds` },
  ];

  const favs = derived
    ? [
        derived.favKit >= 0 && ['Kit', kitName(derived.favKit)],
        derived.favVehicle >= 0 && ['Vehicle', vehicleName(derived.favVehicle)],
        derived.favWeapon >= 0 && ['Weapon', weaponName(derived.favWeapon)],
        derived.favArmy >= 0 && ['Army', armyName(derived.favArmy)],
      ].filter(Boolean)
    : [];

  const roles = stats
    ? [
        ['Commander', stats.time.cmd],
        ['Squad Leader', stats.time.sql],
        ['Squad Member', stats.time.sqm],
        ['Lone Wolf', stats.time.lw],
      ]
    : [];

  return (
    <div className="glass profile">
        <div className="profile-head">
          <RankBadge rank={rank} size={72} />
          <div className="profile-id">
            <div className="profile-name">{player.name}</div>
            <div className="profile-rank">
              {rank.name}
              {player.country && (
                <span className="profile-country">
                  {flagEmoji(player.country)} {player.country.toUpperCase()}
                </span>
              )}
              <Link
                className="profile-guide"
                href={`/ranks?rank=${nextRank(rank).index}#rank-${nextRank(rank).index}`}
              >
                Rank guide
              </Link>
            </div>

            <div className="profile-meta">
              {stats?.joined ? `Enlisted ${formatDate(stats.joined)} · ` : ''}
              Last battle {formatDate(player.last_online)}
            </div>
          </div>
          {favs.length > 0 && (
            <div className="profile-favs">
              {favs.map(([label, value]) => (
                <div className="fav-chip" key={label}>
                  <span className="fav-label">{label}</span>
                  <span className="fav-value">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="summary-grid">
          {cards.map((card) => (
            <div className="summary-card" key={card.title}>
              <div className="bar-title">{card.title}</div>
              <div className="summary-body">
                <div className="summary-figure">
                  <span className="summary-value">{card.value}</span>
                  <span className="summary-unit">{card.unit}</span>
                </div>
                <div className="summary-note">{card.note}</div>
              </div>
            </div>
          ))}
        </div>

        {stats ? (
          <>
            <div className="section-block">
              <div className="two-col">
                <InfoBox title="Time played" note={formatDuration(seconds)}>
                  <div className="role-bars">
                    {roles.map(([label, secs]) => (
                      <div className="role" key={label}>
                        <div className="role-row">
                          <span className="role-label">{label}</span>
                          <span className="role-value">
                            {formatDuration(secs)} <em>{percent(secs, seconds, 2)}</em>
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${seconds ? Math.max((secs / seconds) * 100, secs ? 1 : 0) : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoBox>

                <InfoBox title="Global">
                  <KeyValues
                    rows={[
                      ['Total score', formatNumber(stats.score.total)],
                      ['Teamwork score', formatNumber(stats.score.team)],
                      ['Combat score', formatNumber(stats.score.skill)],
                      ['Commander score', formatNumber(stats.score.cmd)],
                      ['Score per minute', minutes ? (stats.score.total / minutes).toFixed(2) : '0.00'],
                      ['Player ID', String(player.external_id ?? '—')],
                    ]}
                  />
                </InfoBox>
              </div>
            </div>

            <div className="section-block">
              <div className="two-col">
                <InfoBox title="Teamwork">
                  <KeyValues
                    rows={[
                      ['Rounds', formatNumber(stats.team.rounds)],
                      ['Wins', formatNumber(stats.team.wins)],
                      ['Losses', formatNumber(stats.team.losses)],
                      ['Flag stats'],
                      ['Captures', formatNumber(stats.team.captures)],
                      ['Capture assists', formatNumber(stats.team.captureassists)],
                      ['Neutralizes', formatNumber(stats.team.neutralizes)],
                      ['Flag defends', formatNumber(stats.team.defends)],
                      ['Other teamwork'],
                      ['Kill assists', formatNumber(stats.team.damageassists)],
                      ['Heals', formatNumber(stats.team.heals)],
                      ['Revives', formatNumber(stats.team.revives)],
                      ['Resupplies', formatNumber(stats.team.ammos)],
                      ['Repairs', formatNumber(stats.team.repairs)],
                      ['Driver special abilities', formatNumber(stats.team.driverspecials)],
                    ]}
                  />
                </InfoBox>

                <InfoBox title="Combat">
                  <KeyValues
                    rows={[
                      ['Accuracy', `${derived.accuracy.toFixed(2)}%`],
                      ['K/D ratio', ratio(kills, deaths)],
                      ['Kills'],
                      ['Total', formatNumber(kills)],
                      ['Best streak', formatNumber(stats.combat.killstreak)],
                      ['Per minute (avg)', minutes ? (kills / minutes).toFixed(2) : '0.00'],
                      ['Per round (avg)', rounds ? (kills / rounds).toFixed(2) : '0.00'],
                      ['Deaths'],
                      ['Total', formatNumber(deaths)],
                      ['Worst streak', formatNumber(stats.combat.deathstreak)],
                      ['Per round (avg)', rounds ? (deaths / rounds).toFixed(2) : '0.00'],
                      ['Rivals'],
                      ['Most killed by', stats.nemesis ? `${stats.nemesis.name} (${formatNumber(stats.nemesis.count)})` : '—'],
                      ['Favorite victim', stats.victim ? `${stats.victim.name} (${formatNumber(stats.victim.count)})` : '—'],
                    ]}
                  />
                </InfoBox>
              </div>
            </div>
          </>
        ) : (
          <div className="section-block">
            <p className="notice">
              Detailed stats for this player haven&apos;t been imported yet.
            </p>
          </div>
        )}

        {awardsMissing ? (
          <div className="section-block">
            <p className="notice">
              Awards aren&apos;t set up yet. Run <strong>010_profiles.sql</strong> and{' '}
              <strong>011_awards_catalog.sql</strong> in Supabase to enable them.
            </p>
          </div>
        ) : (
          <ProfileAwards catalog={catalog} earned={earned} />
        )}

        {stats && (
          <div className="section-block">
            <DataTable
              title="Kits"
              columns={['Kit', 'Time', 'Kills', 'Deaths', 'K/D']}
              rows={stats.kits.map((k, i) => [
                kitName(i), formatDuration(k[0]), formatNumber(k[1]), formatNumber(k[2]), ratio(k[1], k[2]),
              ])}
            />
            <DataTable
              title="Vehicles"
              columns={['Vehicle', 'Time', 'Kills', 'Road kills', 'Deaths', 'K/D']}
              rows={stats.vehicles.map((v, i) => [
                vehicleName(i), formatDuration(v[0]), formatNumber(v[1]), formatNumber(v[3]),
                formatNumber(v[2]), ratio(v[1], v[2]),
              ])}
            />
            <DataTable
              title="Weapons"
              columns={['Weapon', 'Time', 'Kills', 'Deaths', 'K/D', 'Accuracy']}
              rows={stats.weapons.map((w, i) => [
                weaponName(i), formatDuration(w[0]), formatNumber(w[1]), formatNumber(w[2]),
                ratio(w[1], w[2]), w[3] > 0 ? `${((w[4] / w[3]) * 100).toFixed(2)}%` : '—',
              ])}
            />
            {stats.armies.length > 0 && (
              <DataTable
                title="Armies"
                columns={['Army', 'Time', 'Wins', 'Losses', 'W/L', 'Best round']}
                rows={stats.armies.map((a) => [
                  armyName(a[0]), formatDuration(a[1]), formatNumber(a[2]), formatNumber(a[3]),
                  ratio(a[2], a[3]), formatNumber(a[5]),
                ])}
              />
            )}
          </div>
        )}
    </div>
  );
}
