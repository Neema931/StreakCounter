import { useEffect, useState } from 'react';
import './GoalsReminders.css';

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export default function GoalsReminders({ habit, onSave, saving }) {
  const [goal, setGoal] = useState({
    target: habit.goal?.target ?? 1,
    unit: habit.goal?.unit ?? 'times',
    frequency: habit.goal?.frequency ?? 'daily',
  });
  const [reminder, setReminder] = useState({
    enabled: Boolean(habit.reminder?.enabled),
    time: habit.reminder?.time ?? '09:00',
  });
  const [message, setMessage] = useState('');
  const progressValue = Number(habit.toolData?.progress ?? 0);
  const progress = goal.target > 0 ? Math.min(100, Math.round((progressValue / goal.target) * 100)) : 0;
  const longestInDays = habit.longestStreak * (habit.frequency === 'weekly' ? 7 : 1);

  useEffect(() => {
    setGoal({
      target: habit.goal?.target ?? 1,
      unit: habit.goal?.unit ?? 'times',
      frequency: habit.goal?.frequency ?? 'daily',
    });
    setReminder({
      enabled: Boolean(habit.reminder?.enabled),
      time: habit.reminder?.time ?? '09:00',
    });
  }, [habit.id, habit.goal, habit.reminder]);

  async function saveGoal(event) {
    event.preventDefault();
    const saved = await onSave({ goal: { ...goal, target: Math.max(1, Number(goal.target) || 1) } });
    if (saved !== false) {
      setMessage('Goal saved.');
      window.setTimeout(() => setMessage(''), 1800);
    }
  }

  async function saveReminder(nextReminder) {
    setReminder(nextReminder);
    await onSave({ reminder: nextReminder });
  }

  return (
    <section className="habit-panel habit-goals" aria-labelledby="habit-goals-title">
      <div className="habit-panel__heading">
        <div><p className="habit-detail-eyebrow">AIM FOR SOMETHING</p><h2 id="habit-goals-title">Goals & reminders</h2></div>
      </div>
      <form className="habit-goals__form" onSubmit={saveGoal}>
        <label htmlFor="habit-goal-target">Target amount</label>
        <div className="habit-goals__goal-fields">
          <input
            id="habit-goal-target"
            type="number"
            min="1"
            max="100000"
            value={goal.target}
            onChange={(event) => setGoal((current) => ({ ...current, target: event.target.value }))}
          />
          <input
            aria-label="Goal unit"
            maxLength="24"
            value={goal.unit}
            onChange={(event) => setGoal((current) => ({ ...current, unit: event.target.value }))}
            placeholder="times"
          />
          <select
            aria-label="Goal frequency"
            value={goal.frequency}
            onChange={(event) => setGoal((current) => ({ ...current, frequency: event.target.value }))}
          >
            <option value="daily">per day</option>
            <option value="weekly">per week</option>
          </select>
        </div>
        <div className="habit-goals__progress-copy"><span>Progress</span><strong>{progressValue} / {goal.target} {goal.unit}</strong></div>
        <div className="habit-goals__progress" role="progressbar" aria-label="Goal progress" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="habit-goals__submit-row">
          <span aria-live="polite">{message}</span>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save target'}</button>
        </div>
      </form>

      <div className="habit-goals__reminder">
        <div><strong>Daily reminder</strong><span>Choose a gentle nudge.</span></div>
        <label className="habit-goals__switch">
          <input
            type="checkbox"
            checked={reminder.enabled}
            onChange={(event) => saveReminder({ ...reminder, enabled: event.target.checked })}
          />
          <span aria-hidden="true" />
          <span className="sr-only">Enable daily reminder</span>
        </label>
        <input
          aria-label="Reminder time"
          type="time"
          disabled={!reminder.enabled || saving}
          value={reminder.time}
          onChange={(event) => saveReminder({ ...reminder, time: event.target.value })}
        />
      </div>

      <div className="habit-goals__badges">
        <h3>Milestone badges</h3>
        <div>
          {MILESTONES.map((days) => {
            const earned = longestInDays >= days;
            return (
              <span className={earned ? 'is-earned' : ''} key={days} aria-label={`${days} day milestone${earned ? ', earned' : ', locked'}`}>
                <strong>{earned ? '✦' : '·'}</strong>{days}d
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
