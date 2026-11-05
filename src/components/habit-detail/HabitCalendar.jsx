import { useEffect, useMemo, useRef, useState } from 'react';
import { getLocalDate } from '../../utils/streaks.js';
import './HabitCalendar.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shiftDate(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export default function HabitCalendar({ habit, onUpdateDay, saving }) {
  const today = getLocalDate();
  const [monthOffset, setMonthOffset] = useState(0);
  const [focusedDate, setFocusedDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState('');
  const [dayNote, setDayNote] = useState('');
  const dateButtonRefs = useRef(new Map());
  const firstOfMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const year = firstOfMonth.getFullYear();
  const month = firstOfMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const monthName = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(firstOfMonth);
  const dates = useMemo(() => Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    if (day < 1 || day > daysInMonth) return null;
    return toDateKey(new Date(year, month, day));
  }), [daysInMonth, month, offset, year]);
  const notesByDate = new Map((Array.isArray(habit.notes) ? habit.notes : []).map((note) => [note.date, note.text]));
  const heatmapDates = useMemo(() => {
    const [currentYear, currentMonth, currentDay] = today.split('-').map(Number);
    const lastDate = new Date(currentYear, currentMonth - 1, currentDay);
    return Array.from({ length: 365 }, (_, index) => {
      const date = new Date(lastDate);
      date.setDate(lastDate.getDate() - (364 - index));
      const key = toDateKey(date);
      return { key, completed: habit.history.includes(key) };
    });
  }, [habit.history, today]);

  useEffect(() => {
    dateButtonRefs.current.get(focusedDate)?.focus();
  }, [focusedDate, monthOffset]);

  function openDate(date) {
    if (date > today) return;
    setSelectedDate(date);
    setFocusedDate(date);
    setDayNote(notesByDate.get(date) ?? '');
  }

  function navigateMonth(direction) {
    const nextOffset = Math.min(0, monthOffset + direction);
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth() + nextOffset, 1);
    setMonthOffset(nextOffset);
    setFocusedDate(toDateKey(firstDay));
  }

  function handleDateKeyDown(event, date) {
    const movement = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (movement === undefined) return;
    event.preventDefault();
    const nextDate = shiftDate(date, movement);
    const [nextYear, nextMonth] = nextDate.slice(0, 7).split('-').map(Number);
    const visibleYear = firstOfMonth.getFullYear();
    const visibleMonth = firstOfMonth.getMonth() + 1;
    if (nextYear !== visibleYear || nextMonth !== visibleMonth) {
      const delta = (nextYear - year) * 12 + nextMonth - (month + 1);
      setMonthOffset((value) => value + delta);
    }
    setFocusedDate(nextDate);
  }

  async function saveSelectedDate(event) {
    event.preventDefault();
    const completed = habit.history.includes(selectedDate);
    if (await onUpdateDay(selectedDate, completed, dayNote)) setSelectedDate('');
  }

  async function toggleSelectedCompletion() {
    await onUpdateDay(selectedDate, !habit.history.includes(selectedDate), dayNote);
  }

  return (
    <section className="habit-panel habit-calendar" aria-labelledby="habit-calendar-title">
      <div className="habit-panel__heading">
        <div><p className="habit-detail-eyebrow">YOUR HISTORY</p><h2 id="habit-calendar-title">Calendar</h2></div>
        <div className="habit-calendar__nav">
          <button type="button" aria-label="Previous month" onClick={() => navigateMonth(-1)}>‹</button>
          <strong aria-live="polite">{monthName}</strong>
          <button
            type="button"
            aria-label="Next month"
            disabled={monthOffset >= 0}
            onClick={() => navigateMonth(1)}
          >›</button>
        </div>
      </div>
      <div className="habit-calendar__grid" role="grid" aria-label={monthName}>
        {WEEKDAYS.map((day) => <span className="habit-calendar__weekday" role="columnheader" key={day}>{day}</span>)}
        {dates.map((date, index) => {
          if (!date) return <span className="habit-calendar__empty" role="gridcell" key={`empty-${index}`} />;
          const completed = habit.history.includes(date);
          const isToday = date === today;
          const isFuture = date > today;
          const label = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
            .format(new Date(`${date}T12:00:00`));
          return (
            <button
              type="button"
              role="gridcell"
              key={date}
              ref={(node) => {
                if (node) dateButtonRefs.current.set(date, node);
                else dateButtonRefs.current.delete(date);
              }}
              className={`habit-calendar__day${completed ? ' is-complete' : ''}${isToday ? ' is-today' : ''}${isFuture ? ' is-future' : ''}${selectedDate === date ? ' is-selected' : ''}`}
              aria-label={`${label}${completed ? ', completed' : ''}${notesByDate.has(date) ? ', has a note' : ''}`}
              aria-pressed={completed}
              disabled={isFuture}
              tabIndex={date === focusedDate ? 0 : -1}
              onClick={() => openDate(date)}
              onKeyDown={(event) => handleDateKeyDown(event, date)}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>
      <p className="habit-calendar__hint">Select today or a past day to update it and add a note.</p>
      {selectedDate && (
        <form className="habit-calendar__editor" onSubmit={saveSelectedDate}>
          <label htmlFor="habit-day-note">
            {new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date(`${selectedDate}T12:00:00`))}
          </label>
          <button
            className={`habit-calendar__toggle${habit.history.includes(selectedDate) ? ' is-complete' : ''}`}
            type="button"
            aria-pressed={habit.history.includes(selectedDate)}
            disabled={saving}
            onClick={toggleSelectedCompletion}
          >
            {habit.history.includes(selectedDate) ? '✓ Completed' : '＋ Mark complete'}
          </button>
          <textarea
            id="habit-day-note"
            rows="2"
            maxLength="280"
            value={dayNote}
            onChange={(event) => setDayNote(event.target.value)}
            placeholder="Add a short note for this day…"
          />
          <div className="habit-calendar__editor-actions">
            <button type="button" onClick={() => setSelectedDate('')}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save note'}</button>
          </div>
        </form>
      )}
      <div className="habit-calendar__heatmap-heading">
        <h3>Last 12 months</h3><span>{habit.history.length} completions</span>
      </div>
      <div className="habit-calendar__heatmap" role="img" aria-label="Completion activity over the last 12 months">
        {heatmapDates.map(({ key, completed }) => (
          <span key={key} className={completed ? 'is-filled' : ''} title={`${key}${completed ? ': complete' : ''}`} />
        ))}
      </div>
    </section>
  );
}
