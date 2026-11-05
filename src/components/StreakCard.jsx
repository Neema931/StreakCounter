import Card from './Card.jsx';
import { Link, useNavigate } from 'react-router-dom';
import './StreakCard.css';

export default function StreakCard({
  habit,
  count = 0,
  weekDays = [],
  isCompletedForPeriod = false,
  paused = false,
  saving = false,
  onMarkDone,
}) {
  const navigate = useNavigate();
  const detailPath = `/habit/${encodeURIComponent(habit.id)}`;
  const isWeekly = habit.frequency === 'weekly';
  return (
    <Card
      className={`streak-card${isCompletedForPeriod ? ' is-completed' : ''}`}
      role="group"
      tabIndex={0}
      aria-label={`${habit.name} streak card`}
      onClick={(event) => {
        if (!event.target.closest('button, a')) navigate(detailPath);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        navigate(detailPath);
      }}
    >
      <div className="streak-card__topline">
        <span className="streak-card__habit-icon" aria-hidden="true">{habit.icon}</span>
        <svg
          className={`streak-card__flame${isCompletedForPeriod ? ' is-animated' : ''}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M13.2 1.8c.5 4-1.3 5.9-3.1 7.7-1.7 1.8-3.4 3.6-3.4 6.6a7.3 7.3 0 0 0 14.6 0c0-4-2.3-7.3-6.8-10.2.2 2.5-.7 3.8-1.8 4.7.3-4-.6-6.6-2.5-8.8-.4-.4-.8-.4-1 0Z" />
          <path d="M13.2 21a3.3 3.3 0 0 1-3.3-3.3c0-1.2.6-2.1 1.8-3.4.7-.8 1.5-1.7 2-2.9.9 1.6 1.2 2.9 1.2 4.4 1.1-.8 1.7-1.7 1.9-2.8.9 1.3 1.4 2.8 1.4 4.5a5 5 0 0 1-5 3.5Z" />
        </svg>
      </div>
      <h3 className="streak-card__title"><Link to={detailPath}>{habit.name}</Link></h3>
      <span className="streak-card__frequency">
        {habit.frequency === 'weekly' ? 'Weekly' : 'Daily'}
      </span>
      <p className="streak-card__count">
        <strong>{count}</strong>{' '}
        <span>
          {isWeekly
            ? count === 1 ? 'week' : 'weeks'
            : count === 1 ? 'day' : 'days'}
        </span>
      </p>
      <div className="streak-card__week" aria-label="This week’s completion history">
        {weekDays.map((day) => (
          <div className="streak-card__day" key={day.date}>
            <span className={`streak-card__dot${day.completed ? ' is-filled' : ''}`} aria-label={day.completed ? `${day.label}, complete` : `${day.label}, incomplete`} />
            <span className="streak-card__day-label">{day.label}</span>
          </div>
        ))}
      </div>
      <button
        className={`streak-card__checkin${isCompletedForPeriod ? ' is-done' : ''}`}
        type="button"
        onClick={onMarkDone}
        disabled={isCompletedForPeriod || paused || saving}
        aria-pressed={isCompletedForPeriod}
      >
        {paused ? 'Paused' : isCompletedForPeriod ? (
          <><span aria-hidden="true">✓</span> {isWeekly ? 'Done this week' : 'Done today'}</>
        ) : saving ? 'Saving…' : isWeekly ? 'Mark done this week' : 'Mark done today'}
      </button>
    </Card>
  );
}
