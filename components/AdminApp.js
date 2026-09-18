'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminPlayers from '@/components/AdminPlayers';
import {
  PLAYER_COUNTS,
  MAP_SIZES,
  defaultBotCount,
  supportedSizesForMap,
} from '@/lib/stats';
import {
  saveGameLog,
  deleteGameLog,
  addMap,
  deleteMap,
  updateMapSizes,
} from '@/app/admin/actions';

const emptyForm = {
  id: '',
  map_id: '',
  player_count: 3,
  map_size: 16,
  bot_count: 30,
  result: 'win',
  difficulty: '',
  played_at: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function AdminApp({ userEmail, maps, logs, players, playersMissing }) {
  const [form, setForm] = useState(emptyForm);
  const [showMapForm, setShowMapForm] = useState(false);

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'player_count') {
        next.bot_count = defaultBotCount(value);
      }
      if (field === 'map_id') {
        const selected = maps.find((m) => String(m.id) === String(value));
        const sizes = selected ? supportedSizesForMap(selected) : MAP_SIZES;
        if (!sizes.includes(Number(next.map_size))) {
          next.map_size = sizes[0] ?? '';
        }
      }
      return next;
    });
  }

  const selectedMap = maps.find((m) => String(m.id) === String(form.map_id));
  const availableSizes = selectedMap ? supportedSizesForMap(selectedMap) : MAP_SIZES;

  function startEdit(log) {
    setForm({
      id: log.id,
      map_id: log.map_id,
      player_count: log.player_count,
      map_size: log.map_size,
      bot_count: log.bot_count,
      result: log.result,
      difficulty: log.difficulty ?? '',
      played_at: log.played_at ?? '',
      notes: log.notes ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(emptyForm);
  }

  return (
    <main className="page">
      <div className="page-actions">
        <Link className="nav-link" href="/">
          &larr; Back to progression
        </Link>
      </div>

      <section className="panel">
        <h2>{form.id ? 'Edit session' : 'Log a new session'}</h2>
        <form
          className="form form-grid"
          action={async (formData) => {
            await saveGameLog(formData);
            resetForm();
          }}
        >
          <input type="hidden" name="id" value={form.id} />

          <label className="field">
            <span>Map</span>
            <select
              name="map_id"
              value={form.map_id}
              onChange={(e) => updateField('map_id', e.target.value)}
              required
            >
              <option value="" disabled>
                Select a map
              </option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Players</span>
            <select
              name="player_count"
              value={form.player_count}
              onChange={(e) => updateField('player_count', e.target.value)}
            >
              {PLAYER_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Server size</span>
            <select
              name="map_size"
              value={form.map_size}
              onChange={(e) => updateField('map_size', e.target.value)}
              required
            >
              {availableSizes.length === 0 && (
                <option value="" disabled>
                  No sizes available
                </option>
              )}
              {availableSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Bots</span>
            <input
              type="number"
              name="bot_count"
              min="0"
              value={form.bot_count}
              onChange={(e) => updateField('bot_count', e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Result</span>
            <select
              name="result"
              value={form.result}
              onChange={(e) => updateField('result', e.target.value)}
            >
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>
          </label>

          <label className="field">
            <span>Difficulty (1&ndash;5)</span>
            <input
              type="number"
              name="difficulty"
              min="1"
              max="5"
              value={form.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Date played (optional)</span>
            <input
              type="date"
              name="played_at"
              value={form.played_at}
              onChange={(e) => updateField('played_at', e.target.value)}
            />
          </label>

          <label className="field field-wide">
            <span>Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={2}
            />
          </label>

          <div className="form-actions">
            <button className="button" type="submit">
              {form.id ? 'Save changes' : 'Add session'}
            </button>
            {form.id && (
              <button
                className="button button-secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <AdminPlayers players={players} playersMissing={playersMissing} />

      <section className="panel">
        <div className="panel-header">
          <h2>Maps</h2>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setShowMapForm((v) => !v)}
          >
            {showMapForm ? 'Close' : 'Add map'}
          </button>
        </div>
        {showMapForm && (
          <form
            className="form form-inline"
            action={async (formData) => {
              await addMap(formData);
            }}
          >
            <label className="field">
              <span>Name</span>
              <input type="text" name="name" required />
            </label>
            <label className="field">
              <span>Sort order</span>
              <input
                type="number"
                name="sort_order"
                step="any"
                defaultValue={maps.length + 1}
                required
              />
            </label>
            <fieldset className="checkbox-group">
              <legend>Available sizes</legend>
              {MAP_SIZES.map((size) => (
                <label key={size} className="checkbox-field">
                  <input type="checkbox" name={`supports_${size}`} defaultChecked />
                  {size}
                </label>
              ))}
            </fieldset>
            <button className="button" type="submit">
              Add
            </button>
          </form>
        )}
        <ul className="map-list">
          {maps.map((map) => (
            <li key={map.id} className="map-row">
              <span className="map-row-name">{map.name}</span>
              <form className="checkbox-group" action={updateMapSizes}>
                <input type="hidden" name="id" value={map.id} />
                {MAP_SIZES.map((size) => (
                  <label key={size} className="checkbox-field">
                    <input
                      type="checkbox"
                      name={`supports_${size}`}
                      defaultChecked={map[`supports_${size}`] !== false}
                    />
                    {size}
                  </label>
                ))}
                <button className="link-button" type="submit">
                  Save
                </button>
              </form>
              <form action={deleteMap}>
                <input type="hidden" name="id" value={map.id} />
                <button className="link-button link-danger" type="submit">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Recent sessions</h2>
        <div className="table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Map</th>
                <th>Players</th>
                <th>Size</th>
                <th>Bots</th>
                <th>Result</th>
                <th>Difficulty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.played_at ?? <span className="date-unknown">(unknown date)</span>}</td>
                  <td className="map-name">{log.bf2_maps?.name ?? 'Unknown'}</td>
                  <td>{log.player_count}</td>
                  <td>{log.map_size}</td>
                  <td>{log.bot_count}</td>
                  <td>
                    <span
                      className={
                        log.result === 'win' ? 'badge badge-yes' : 'badge badge-no'
                      }
                    >
                      {log.result}
                    </span>
                  </td>
                  <td>{log.difficulty ?? '—'}</td>
                  <td className="row-actions">
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => startEdit(log)}
                    >
                      Edit
                    </button>
                    <form action={deleteGameLog}>
                      <input type="hidden" name="id" value={log.id} />
                      <button className="link-button link-danger" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-row">
                    No sessions logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
