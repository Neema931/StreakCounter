import { useState } from 'react';
import { getLocalDate } from '../../utils/streaks.js';
import './NotesJournal.css';

export default function NotesJournal({ habit, onUpdateDay, saving }) {
  const [note, setNote] = useState('');
  const notes = Array.isArray(habit.notes) ? [...habit.notes].sort((a, b) => b.date.localeCompare(a.date)) : [];
  const today = getLocalDate();

  async function saveNote(event) {
    event.preventDefault();
    if (!note.trim()) return;
    if (await onUpdateDay(today, habit.history.includes(today), note)) setNote('');
  }

  return (
    <section className="habit-panel habit-notes" aria-labelledby="habit-notes-title">
      <div className="habit-panel__heading">
        <div><p className="habit-detail-eyebrow">REFLECT & REMEMBER</p><h2 id="habit-notes-title">Journal & notes</h2></div>
      </div>
      <form className="habit-notes__form" onSubmit={saveNote}>
        <label className="sr-only" htmlFor="habit-new-note">Add a note for today</label>
        <textarea id="habit-new-note" rows="3" maxLength="500" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note about today…" />
        <button type="submit" disabled={saving || !note.trim()}>{saving ? 'Saving…' : 'Save note'}</button>
      </form>
      {notes.length ? (
        <ul className="habit-notes__list">
          {notes.slice(0, 12).map((entry, index) => (
            <li key={`${entry.date}-${index}`}>
              <time dateTime={entry.date}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${entry.date}T12:00:00`))}</time>
              <p>{entry.text}</p>
            </li>
          ))}
        </ul>
      ) : <p className="habit-notes__empty">Your notes will appear here. A few words are plenty.</p>}
    </section>
  );
}
