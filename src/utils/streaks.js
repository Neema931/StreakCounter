const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCalendarDayNumber(dateString) {
  const match = DATE_PATTERN.exec(dateString ?? '');
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return Math.floor(date.getTime() / 86_400_000);
}

export function getCalendarDayDifference(fromDate, toDate) {
  const fromDay = getCalendarDayNumber(fromDate);
  const toDay = getCalendarDayNumber(toDate);
  if (fromDay === null || toDay === null) return null;
  return toDay - fromDay;
}

function getWeekStartDate(date) {
  return getLocalWeekDates(date)[0];
}

export function isHabitCompletedForPeriod(habit, date = new Date()) {
  const normalizedHabit = normalizeHabit(habit);
  const today = typeof date === 'string' ? date : getLocalDate(date);
  if (getCalendarDayNumber(today) === null) {
    throw new RangeError(`Invalid local completion date: ${today}`);
  }

  if (normalizedHabit.frequency === 'weekly') {
    const currentWeekStart = getWeekStartDate(today);
    return normalizedHabit.history.some(
      (historyDate) => getWeekStartDate(historyDate) === currentWeekStart,
    );
  }

  return normalizedHabit.lastCompletedDate === today || normalizedHabit.history.includes(today);
}

export function normalizeHabit(habit, index = 0) {
  const source = typeof habit === 'string' ? { name: habit } : (habit ?? {});
  const { completedDates, streakCount, ...extraFields } = source;
  const history = Array.isArray(source.history)
    ? source.history
    : Array.isArray(source.completedDates)
      ? source.completedDates
      : [];
  const validHistory = [...new Set(history.filter((date) => getCalendarDayNumber(date) !== null))].sort();
  const lastCompletedDate =
    getCalendarDayNumber(source.lastCompletedDate) !== null
      ? source.lastCompletedDate
      : validHistory.at(-1) ?? null;

  return {
    ...extraFields,
    id: source.id || `habit-${index}`,
    name: typeof source.name === 'string' ? source.name : 'Untitled habit',
    icon: typeof source.icon === 'string' && source.icon ? source.icon : '✨',
    frequency: source.frequency === 'weekly' ? 'weekly' : 'daily',
    currentStreak: Number.isInteger(source.currentStreak)
      ? Math.max(0, source.currentStreak)
      : Number.isInteger(source.streakCount)
        ? Math.max(0, source.streakCount)
        : 0,
    longestStreak: Number.isInteger(source.longestStreak) ? Math.max(0, source.longestStreak) : 0,
    lastCompletedDate,
    history: validHistory,
  };
}

export function completeHabit(habit, date = new Date()) {
  const normalizedHabit = normalizeHabit(habit);
  const today = typeof date === 'string' ? date : getLocalDate(date);

  if (getCalendarDayNumber(today) === null) {
    throw new RangeError(`Invalid local completion date: ${today}`);
  }

  if (normalizedHabit.lastCompletedDate === today || normalizedHabit.history.includes(today)) {
    return {
      ...normalizedHabit,
      lastCompletedDate: today,
      history: normalizedHabit.history.includes(today)
        ? normalizedHabit.history
        : [...normalizedHabit.history, today].sort(),
    };
  }

  if (
    normalizedHabit.frequency === 'weekly' &&
    isHabitCompletedForPeriod(normalizedHabit, today)
  ) {
    return normalizedHabit;
  }

  const daysSinceLastCompletion = normalizedHabit.lastCompletedDate
    ? getCalendarDayDifference(normalizedHabit.lastCompletedDate, today)
    : null;
  const periodDifference = normalizedHabit.frequency === 'weekly' && normalizedHabit.lastCompletedDate
    ? getCalendarDayDifference(
      getWeekStartDate(normalizedHabit.lastCompletedDate),
      getWeekStartDate(today),
    ) / 7
    : daysSinceLastCompletion;
  const currentStreak = periodDifference === 1
    ? normalizedHabit.currentStreak + 1
    : 1;
  const history = [...normalizedHabit.history, today].sort();

  return {
    ...normalizedHabit,
    currentStreak,
    longestStreak: Math.max(normalizedHabit.longestStreak, currentStreak),
    lastCompletedDate: today,
    history,
  };
}

export function checkStreaksOnLoad(habits, date = new Date()) {
  const today = typeof date === 'string' ? date : getLocalDate(date);
  if (getCalendarDayNumber(today) === null) {
    throw new RangeError(`Invalid local check date: ${today}`);
  }

  let changed = false;
  const checkedHabits = habits.map((habit, index) => {
    const normalizedHabit = normalizeHabit(habit, index);
    const daysSinceLastCompletion = normalizedHabit.lastCompletedDate
      ? getCalendarDayDifference(normalizedHabit.lastCompletedDate, today)
      : null;
    const weeklyDifference = normalizedHabit.frequency === 'weekly' && normalizedHabit.lastCompletedDate
      ? getCalendarDayDifference(
        getWeekStartDate(normalizedHabit.lastCompletedDate),
        getWeekStartDate(today),
      ) / 7
      : null;
    const shouldReset = normalizedHabit.currentStreak > 0 && (
      normalizedHabit.frequency === 'weekly'
        ? weeklyDifference === null || weeklyDifference > 1
        : daysSinceLastCompletion === null || daysSinceLastCompletion > 1
    );
    const nextHabit = shouldReset
      ? { ...normalizedHabit, currentStreak: 0 }
      : normalizedHabit;

    const storedHistory = typeof habit === 'object' && habit !== null && Array.isArray(habit.history)
      ? habit.history
      : null;
    const hasCurrentSchema =
      typeof habit === 'object' &&
      habit !== null &&
      habit.id === nextHabit.id &&
      habit.name === nextHabit.name &&
      habit.icon === nextHabit.icon &&
      habit.frequency === nextHabit.frequency &&
      habit.currentStreak === nextHabit.currentStreak &&
      habit.longestStreak === nextHabit.longestStreak &&
      habit.lastCompletedDate === nextHabit.lastCompletedDate &&
      storedHistory !== null &&
      storedHistory.length === nextHabit.history.length &&
      storedHistory.every((historyDate, historyIndex) => historyDate === nextHabit.history[historyIndex]) &&
      !Object.hasOwn(habit, 'completedDates') &&
      !Object.hasOwn(habit, 'streakCount');
    if (!hasCurrentSchema) changed = true;
    return nextHabit;
  });

  return { habits: checkedHabits, changed };
}

export function getLocalWeekDates(date = new Date()) {
  const today = typeof date === 'string' ? date : getLocalDate(date);
  const dayNumber = getCalendarDayNumber(today);
  if (dayNumber === null) {
    throw new RangeError(`Invalid local week date: ${today}`);
  }

  const [year, month, day] = today.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  const mondayOffset = (localDate.getDay() + 6) % 7;
  const mondayDayNumber = dayNumber - mondayOffset;

  return Array.from({ length: 7 }, (_, index) => {
    const weekDate = new Date((mondayDayNumber + index) * 86_400_000);
    return `${weekDate.getUTCFullYear()}-${String(weekDate.getUTCMonth() + 1).padStart(2, '0')}-${String(weekDate.getUTCDate()).padStart(2, '0')}`;
  });
}
