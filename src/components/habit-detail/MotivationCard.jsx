import { useState } from 'react';
import { getLocalDate } from '../../utils/streaks.js';
import './MotivationCard.css';

export default function MotivationCard({ habit, quote, onSave, saving }) {
  const [why, setWhy] = useState(habit.whyStarted ?? '');
  const [editing, setEditing] = useState(!habit.whyStarted);
  const [year, month, day] = getLocalDate().split('-').map(Number);
  const quotes = [
    quote,
    `Small steps with ${habit.name.toLowerCase()} still move you forward.`,
    `You can return to ${habit.name.toLowerCase()} one day at a time.`,
  ];
  const dailyQuote = quotes[Math.floor(Date.UTC(year, month - 1, day) / 86_400_000) % quotes.length];

  async function saveWhy(event) {
    event.preventDefault();
    if (await onSave({ whyStarted: why.trim() })) setEditing(false);
  }

  return (
    <section className="habit-panel habit-motivation" aria-labelledby="habit-motivation-title">
      <p className="habit-detail-eyebrow">A THOUGHT FOR TODAY</p>
      <blockquote id="habit-motivation-title">“{dailyQuote}”</blockquote>
      <div className="habit-motivation__why">
        <div><h2>Why I started</h2>{!editing && <p>{why}</p>}</div>
        {!editing && <button type="button" onClick={() => setEditing(true)}>Edit</button>}
      </div>
      {editing && (
        <form onSubmit={saveWhy}>
          <label className="sr-only" htmlFor="habit-why-started">Why did you start this habit?</label>
          <textarea id="habit-why-started" rows="3" maxLength="400" value={why} onChange={(event) => setWhy(event.target.value)} placeholder="Write a reason you want to remember…" />
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save my reason'}</button>
        </form>
      )}
    </section>
  );
}
