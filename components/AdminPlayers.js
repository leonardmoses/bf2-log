'use client';

import { useState } from 'react';
import RankBadge from '@/components/RankBadge';
import { RANKS, rankForPlayer } from '@/lib/ranks';
import { savePlayer, deletePlayer } from '@/app/admin/actions';

const emptyForm = { id: '', name: '', score: 0, rank_override: '' };

export default function AdminPlayers({ players, playersMissing }) {
  const [form, setForm] = useState(emptyForm);

  if (playersMissing) {
    return (
      <section className="panel">
        <h2>Player standings</h2>
        <p className="notice">
          The players table doesn&apos;t exist yet. Run <strong>supabase/007_players.sql</strong> in
          the Supabase SQL editor to enable the leaderboard.
        </p>
      </section>
    );
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const previewRank = rankForPlayer({
    score: Number(form.score) || 0,
    rank_override: form.rank_override === '' ? null : Number(form.rank_override),
  });

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(player) {
    setForm({
      id: player.id,
      name: player.name,
      score: player.score,
      rank_override: player.rank_override ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section className="panel">
      <h2>{form.id ? 'Edit player' : 'Player standings'}</h2>

      <form
        className="form form-grid"
        action={async (formData) => {
          await savePlayer(formData);
          setForm(emptyForm);
        }}
      >
        <input type="hidden" name="id" value={form.id} />

        <label className="field">
          <span>Player name</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Total score</span>
          <input
            type="number"
            name="score"
            min="0"
            value={form.score}
            onChange={(e) => setField('score', e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Rank</span>
          <select
            name="rank_override"
            value={form.rank_override}
            onChange={(e) => setField('rank_override', e.target.value)}
          >
            <option value="">Auto (from score)</option>
            {RANKS.map((rank) => (
              <option key={rank.index} value={rank.index}>
                {rank.name}
              </option>
            ))}
          </select>
        </label>

        <div className="player-info">
          <span className="player-rank">Badge preview</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RankBadge rank={previewRank} />
            <span className="player-rank">{previewRank.name}</span>
          </span>
        </div>

        <div className="form-actions">
          <button className="button" type="submit">
            {form.id ? 'Save player' : 'Add player'}
          </button>
          {form.id && (
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setForm(emptyForm)}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <ul className="player-list">
        {sorted.map((player) => {
          const rank = rankForPlayer(player);
          return (
            <li key={player.id}>
              <RankBadge rank={rank} />
              <span className="player-info">
                <span className="player-name">{player.name}</span>
                <span className="player-rank">
                  {rank.name}
                  {player.rank_override != null ? ' (manual)' : ''}
                </span>
              </span>
              <span className="player-score">{player.score.toLocaleString('en-US')}</span>
              <span className="row-actions">
                <button className="link-button" type="button" onClick={() => startEdit(player)}>
                  Edit
                </button>
                <form action={deletePlayer}>
                  <input type="hidden" name="id" value={player.id} />
                  <button className="link-button link-danger" type="submit">
                    Delete
                  </button>
                </form>
              </span>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li>
            <span />
            <span className="player-rank">No players yet.</span>
          </li>
        )}
      </ul>
    </section>
  );
}
