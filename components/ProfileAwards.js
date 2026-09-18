import AwardIcon from '@/components/AwardIcon';
import AwardTileFrame from '@/components/AwardTileFrame';
import { AWARD_GROUPS, TIER_NAMES, awardIconSources, formatDate, isBadge } from '@/lib/profile';

function Tooltip({ award }) {
  return (
    <div className="award-tip" role="tooltip">
      <div className="award-tip-name">{award.name}</div>
      {award.stages.map((stage, i) => (
        <div className="award-tip-stage" key={i}>
          {stage.stage && <div className="award-tip-stage-name">{stage.stage}</div>}
          <ul>
            {stage.requirements.map((req, j) => (
              <li key={`${j}-${req}`}>{req}</li>
            ))}
          </ul>
        </div>
      ))}
      <div className="award-tip-hint">IAR = in a round, meaning one single game</div>
    </div>
  );
}

function AwardTile({ award, earned }) {
  const level = earned?.level ?? 0;
  let label = 'Not yet earned';
  if (earned) {
    label = isBadge(award.category)
      ? TIER_NAMES[level] ?? `Level ${level}`
      : `${level}×`;
  }

  return (
    <AwardTileFrame className={`award-tile ${earned ? 'award-earned' : 'award-locked'}`}>
      <AwardIcon
        sources={awardIconSources(award, level || 1)}
        category={award.category}
        name={award.name}
        dim={!earned}
      />
      <div className="award-name">{award.name}</div>
      <div className="award-count">{label}</div>
      <div className="award-when">{earned ? formatDate(earned.last_earned) : ' '}</div>
      <Tooltip award={award} />
    </AwardTileFrame>
  );
}

export default function ProfileAwards({ catalog, earned }) {
  const earnedById = new Map(earned.map((e) => [e.award_id, e]));

  return (
    <div className="section-block">
      {AWARD_GROUPS.map((group) => {
        const awards = catalog.filter((a) => a.category === group.key);
        if (awards.length === 0) return null;
        const got = awards.filter((a) => earnedById.has(a.id));
        const notYet = awards.filter((a) => !earnedById.has(a.id));
        return (
          <div className="standings award-group" key={group.key}>
            <div className="bar-header">
              <span className="bar-header-title">{group.title}</span>
              <span className="bar-header-note">
                {got.length} of {awards.length} earned
              </span>
            </div>
            <div className="award-grid">
              {got.map((a) => (
                <AwardTile key={a.id} award={a} earned={earnedById.get(a.id)} />
              ))}
              {notYet.map((a) => (
                <AwardTile key={a.id} award={a} earned={null} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
