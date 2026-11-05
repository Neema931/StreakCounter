import { useCallback, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext.jsx';
import {
  completeHabit,
  getCalendarDayDifference,
  getLocalDate,
  getLocalWeekDates,
  normalizeHabit,
} from '../utils/streaks.js';

function getWeekStart(date) {
  return getLocalWeekDates(date)[0];
}

function countCurrentStreak(history, frequency) {
  if (!history.length) return 0;
  const ordered = [...new Set(history)].sort();
  const periods = frequency === 'weekly'
    ? [...new Set(ordered.map(getWeekStart))]
    : ordered;
  let count = 1;
  for (let index = periods.length - 1; index > 0; index -= 1) {
    const difference = frequency === 'weekly'
      ? getCalendarDayDifference(periods[index - 1], periods[index]) / 7
      : getCalendarDayDifference(periods[index - 1], periods[index]);
    if (difference !== 1) break;
    count += 1;
  }
  const latestDate = ordered.at(-1);
  const latestDifference = frequency === 'weekly'
    ? getCalendarDayDifference(getWeekStart(latestDate), getWeekStart(getLocalDate())) / 7
    : getCalendarDayDifference(latestDate, getLocalDate());
  return latestDifference <= 1 ? count : 0;
}

function countLongestStreak(history, frequency) {
  const ordered = [...new Set(history)].sort();
  const periods = frequency === 'weekly'
    ? [...new Set(ordered.map(getWeekStart))]
    : ordered;
  let longest = 0;
  let current = 0;
  periods.forEach((date, index) => {
    const previous = periods[index - 1];
    const difference = previous
      ? frequency === 'weekly'
        ? getCalendarDayDifference(previous, date) / 7
        : getCalendarDayDifference(previous, date)
      : null;
    current = difference === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  });
  return longest;
}

export default function useHabit(habitId) {
  const { profile, updateProfile, loading, loadError } = useUser();
  const [saving, setSaving] = useState(false);
  const habits = Array.isArray(profile.habits) ? profile.habits : [];
  const index = habits.findIndex((habit) => normalizeHabit(habit).id === habitId);
  const habit = index >= 0 ? normalizeHabit(habits[index], index) : null;

  const saveHabit = useCallback(async (updates) => {
    if (index < 0) throw new Error('This habit is no longer available.');
    setSaving(true);
    try {
      const currentHabits = Array.isArray(profile.habits) ? profile.habits : [];
      const currentIndex = currentHabits.findIndex((item) => normalizeHabit(item).id === habitId);
      if (currentIndex < 0) throw new Error('This habit is no longer available.');

      const nextHabits = currentHabits.map((item, itemIndex) => (
        itemIndex === currentIndex
          ? normalizeHabit({ ...item, ...updates }, itemIndex)
          : normalizeHabit(item, itemIndex)
      ));
      await updateProfile({ habits: nextHabits });
      return nextHabits[currentIndex];
    } finally {
      setSaving(false);
    }
  }, [habitId, index, profile.habits, updateProfile]);

  const markDone = useCallback(async () => {
    if (!habit) throw new Error('This habit is no longer available.');

    const today = getLocalDate();
    const updated = completeHabit(habit, today);
    if (updated.history.length === habit.history.length) return habit;
    const undoSnapshot = {
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      lastCompletedDate: habit.lastCompletedDate,
      history: habit.history,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    return saveHabit({ ...updated, undoSnapshot, lastCheckIn: today });
  }, [habit, saveHabit]);

  const undoLastCheckIn = useCallback(async () => {
    if (!habit?.undoSnapshot || habit.undoSnapshot.expiresAt < Date.now()) return false;
    const restoredHistory = habit.history.filter((date) => date !== habit.lastCheckIn);
    const currentStreak = countCurrentStreak(restoredHistory, habit.frequency);
    const longestStreak = Math.max(
      habit.undoSnapshot.longestStreak,
      countLongestStreak(restoredHistory, habit.frequency),
    );
    await saveHabit({
      currentStreak,
      longestStreak,
      lastCompletedDate: restoredHistory.at(-1) ?? null,
      history: restoredHistory,
      undoSnapshot: null,
      lastCheckIn: null,
    });
    return true;
  }, [habit, saveHabit]);

  const updateDay = useCallback(async (date, completed, note) => {
    if (!habit) throw new Error('This habit is no longer available.');
    const historySet = new Set(habit.history);
    if (completed) historySet.add(date);
    else historySet.delete(date);
    const history = [...historySet].sort();
    const notes = Array.isArray(habit.notes) ? habit.notes.filter((entry) => entry.date !== date) : [];
    if (note.trim()) notes.push({ date, text: note.trim() });
    notes.sort((a, b) => b.date.localeCompare(a.date));
    const lastCompletedDate = history.at(-1) ?? null;
    const currentStreak = countCurrentStreak(history, habit.frequency);
    return saveHabit({
      history,
      notes,
      lastCompletedDate,
      currentStreak,
      longestStreak: Math.max(habit.longestStreak, currentStreak, countLongestStreak(history, habit.frequency)),
    });
  }, [habit, saveHabit]);

  const removeHabit = useCallback(async () => {
    const nextHabits = habits.filter((_, itemIndex) => itemIndex !== index);
    await updateProfile({ habits: nextHabits });
  }, [habits, index, updateProfile]);

  return useMemo(() => ({
    habit,
    loading,
    loadError,
    saving,
    saveHabit,
    markDone,
    undoLastCheckIn,
    updateDay,
    removeHabit,
  }), [habit, loading, loadError, saving, saveHabit, markDone, undoLastCheckIn, updateDay, removeHabit]);
}
