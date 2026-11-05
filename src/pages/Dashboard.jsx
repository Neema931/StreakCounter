import { useMemo, useState } from 'react';
import { useUser } from '../context/UserContext.jsx';
import Card from '../components/Card.jsx';
import HabitPicker from '../components/HabitPicker.jsx';
import Navbar from '../components/Navbar.jsx';
import StreakCard from '../components/StreakCard.jsx';
import {
  completeHabit,
  getLocalDate,
  getLocalWeekDates,
  isHabitCompletedForPeriod,
  normalizeHabit,
} from '../utils/streaks.js';
import './Dashboard.css';

function SummaryCard({ label, value, icon }) {
  return (
    <Card className="dashboard-summary__card">
      <span className="dashboard-summary__icon" aria-hidden="true">{icon}</span>
      <div>
        <p className="dashboard-summary__label">{label}</p>
        <p className="dashboard-summary__value">{value}</p>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { profile, updateProfile } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const today = getLocalDate();
  const weekDates = getLocalWeekDates(today);
  const habits = useMemo(
    () => (Array.isArray(profile.habits) ? profile.habits.map((habit, index) => normalizeHabit(habit, index)) : []),
    [profile.habits],
  );
  const habitStats = habits.map((habit) => ({
    habit,
    currentStreak: habit.currentStreak,
    isCompletedForPeriod: isHabitCompletedForPeriod(habit, today),
    isCompletedToday: habit.lastCompletedDate === today || habit.history.includes(today),
    weekDays: weekDates.map((date, index) => {
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      const label = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(localDate);
      return { date, label, completed: habit.history.includes(date) };
    }),
  }));
  const activeStreaks = habitStats.filter(({ currentStreak }) => currentStreak > 0).length;
  const longestStreak = habitStats.reduce((longest, { habit }) => {
    const candidateDuration = habit.longestStreak * (habit.frequency === 'weekly' ? 7 : 1);
    const longestDuration = longest.count * (longest.frequency === 'weekly' ? 7 : 1);
    return candidateDuration > longestDuration
      ? { count: habit.longestStreak, frequency: habit.frequency }
      : longest;
  }, {
    count: Number.isInteger(profile.longestStreak) ? profile.longestStreak : 0,
    frequency: 'daily',
  });
  const longestStreakLabel = longestStreak.frequency === 'weekly'
    ? `${longestStreak.count} ${longestStreak.count === 1 ? 'week' : 'weeks'}`
    : `${longestStreak.count} ${longestStreak.count === 1 ? 'day' : 'days'}`;
  const completedToday = habitStats.filter(({ isCompletedToday }) => isCompletedToday).length;
  const displayName = profile.username || profile.name || 'friend';

  async function saveProfile(updates) {
    setIsSaving(true);
    setSaveError('');
    try {
      await updateProfile(updates);
    } catch (error) {
      console.error('Unable to save dashboard changes.', error);
      setSaveError('We couldn’t save that change. Please try again.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function addHabit(habit) {
    const alreadyAdded = habits.some(
      (existing) => existing.name.trim().toLowerCase() === habit.name.trim().toLowerCase(),
    );
    if (alreadyAdded) return;
    await saveProfile({
      habits: [
        ...habits,
        normalizeHabit({
          ...habit,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          history: [],
        }, habits.length),
      ],
    });
  }

  async function markHabitDone(habitId) {
    const updatedHabits = habits.map((habit) =>
      habit.id === habitId ? completeHabit(habit, today) : habit,
    );
    try {
      await saveProfile({ habits: updatedHabits });
    } catch {
      // saveProfile reports the failure in the dashboard status message.
    }
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <main className="dashboard">
        <section className="dashboard__welcome">
          <div>
            <p className="eyebrow">A FRESH DAY, A FRESH START</p>
            <h1>Hey {displayName}, keep it going!</h1>
          </div>
          <p className="dashboard__date">
            {new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
          </p>
        </section>

        <section className="dashboard-summary" aria-label="Streak summary">
          <SummaryCard label="Total active streaks" value={activeStreaks} icon="✳" />
          <SummaryCard label="Longest streak" value={longestStreakLabel} icon="🏆" />
          <SummaryCard label="Today’s completed habits" value={completedToday} icon="✓" />
        </section>

        <section className="dashboard-section" aria-labelledby="habit-picker-title">
          <div className="dashboard-section__heading">
            <div>
              <p className="eyebrow">BUILD YOUR ROUTINE</p>
              <h2 id="habit-picker-title">Choose what you want to track</h2>
            </div>
          </div>
          <HabitPicker habits={habits} onAdd={addHabit} saving={isSaving} />
        </section>

        <section className="dashboard-section dashboard-streaks" aria-labelledby="my-streaks-title">
          <div className="dashboard-section__heading">
            <div>
              <p className="eyebrow">ONE DAY AT A TIME</p>
              <h2 id="my-streaks-title">My streaks</h2>
            </div>
            {habits.length > 0 && (
              <span className="dashboard-streaks__count">{habits.length} {habits.length === 1 ? 'habit' : 'habits'}</span>
            )}
          </div>

          {habitStats.length ? (
            <div className="dashboard-streaks__grid">
              {habitStats.map(({ habit, currentStreak, isCompletedForPeriod, weekDays }) => (
                <StreakCard
                  key={habit.id}
                  habit={habit}
                  count={currentStreak}
                  weekDays={weekDays}
                  isCompletedForPeriod={isCompletedForPeriod}
                  paused={habit.paused}
                  saving={isSaving}
                  onMarkDone={() => markHabitDone(habit.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="dashboard-empty">
              <div className="dashboard-empty__art" aria-hidden="true">
                <span>☁️</span><span>🌱</span><span>☀️</span>
              </div>
              <h3>Your first streak is waiting.</h3>
              <p>Add a habit above, then come back each day to watch your streak grow.</p>
            </Card>
          )}
        </section>

        {saveError && <p className="dashboard__save-error" role="alert">{saveError}</p>}
      </main>
    </div>
  );
}
