import './StreakHero.css';
import { getCalendarDayDifference, getLocalDate, getLocalWeekDates } from '../../utils/streaks.js';

export default function StreakHero({
  habit,
  completed,
  saving,
  onMarkDone,
  onUndo,
  undoAvailable,
  celebrating,
}) {
  const unit = habit.frequency === 'weekly'
    ? habit.currentStreak === 1 ? 'week' : 'weeks'
    : habit.currentStreak === 1 ? 'day' : 'days';
  const firstDay = habit.history[0];
  const elapsedDays = firstDay
    ? Math.max(1, getCalendarDayDifference(firstDay, getLocalDate()) + 1)
    : 0;
  const firstWeek = firstDay ? getLocalWeekDates(firstDay)[0] : null;
  const currentWeek = getLocalWeekDates()[0];
  const elapsedPeriods = habit.frequency === 'weekly' && firstWeek
    ? Math.max(1, Math.floor(getCalendarDayDifference(firstWeek, currentWeek) / 7) + 1)
    : elapsedDays;
  const completedPeriods = habit.frequency === 'weekly'
    ? new Set(habit.history.map((date) => getLocalWeekDates(date)[0])).size
    : habit.history.length;
  const completionRate = elapsedPeriods
    ? Math.min(100, Math.round((completedPeriods / elapsedPeriods) * 100))
    : 0;

  return (
    <section className="habit-hero" aria-labelledby="habit-hero-title">
      {celebrating && (
        <div className="habit-hero__confetti" aria-hidden="true">
          {['✦', '✧', '✦', '✧', '✦', '✧'].map((shape, index) => (
            <span key={index} style={{ '--confetti-index': index }}>{shape}</span>
          ))}
        </div>
      )}
      <div className="habit-hero__headline">
        <span className="habit-hero__flame" aria-hidden="true">🔥</span>
        <div>
          <p className="habit-detail-eyebrow">YOUR CURRENT STREAK</p>
          <h2 id="habit-hero-title" aria-live="polite">
            {habit.currentStreak} <span>{unit}</span>
          </h2>
        </div>
      </div>
      <div className="habit-hero__stats">
        <div><strong>{habit.longestStreak} <small>{habit.frequency === 'weekly' ? 'wk' : 'd'}</small></strong><span>Longest streak</span></div>
        <div><strong>{habit.history.length}</strong><span>Total days completed</span></div>
        <div><strong>{completionRate}%</strong><span>Completion rate</span></div>
      </div>
      <button
        className={`habit-hero__checkin${completed ? ' is-done' : ''}`}
        type="button"
        disabled={completed || saving || habit.paused}
        aria-pressed={completed}
        onClick={onMarkDone}
      >
        {completed ? `✓ Done ${habit.frequency === 'weekly' ? 'this week' : 'for today'}` : saving ? 'Saving…' : habit.paused ? 'Habit paused' : habit.frequency === 'weekly' ? 'Mark done this week' : 'Mark done today'}
      </button>
      {undoAvailable && (
        <button className="habit-hero__undo" type="button" onClick={onUndo}>
          Undo last check-in (5 min)
        </button>
      )}
    </section>
  );
}
