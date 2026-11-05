import { getCalendarDayDifference, getLocalWeekDates } from '../../utils/streaks.js';
import './StatsCharts.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthKey(date) {
  return date.slice(0, 7);
}

export default function StatsCharts({ habit }) {
  const weekDates = getLocalWeekDates();
  const weeklyValues = weekDates.map((date) => habit.history.includes(date) ? 1 : 0);
  const currentMonth = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date),
      value: habit.history.filter((item) => monthKey(item) === key).length,
    };
  });
  const maxMonthly = Math.max(1, ...months.map((month) => month.value));
  const points = months.map((month, index) => {
    const x = 20 + index * 64;
    const y = 112 - (month.value / maxMonthly) * 84;
    return `${x},${y}`;
  }).join(' ');
  const weekdayCounts = WEEKDAYS.map((day, index) => ({
    day,
    count: habit.history.filter((date) => {
      const [year, month, dayOfMonth] = date.split('-').map(Number);
      return (new Date(year, month - 1, dayOfMonth).getDay() + 6) % 7 === index;
    }).length,
  }));
  const bestDay = weekdayCounts.reduce((best, item) => item.count > best.count ? item : best, weekdayCounts[0]);
  const streakPeriods = habit.frequency === 'weekly'
    ? [...new Set(habit.history.map((date) => getLocalWeekDates(date)[0]))].sort()
    : [...new Set(habit.history)].sort();
  let runCount = 0;
  let runTotal = 0;
  streakPeriods.forEach((date, index) => {
    const previous = streakPeriods[index - 1];
    const difference = previous ? getCalendarDayDifference(previous, date) : null;
    if (difference !== (habit.frequency === 'weekly' ? 7 : 1)) {
      runCount += 1;
    }
    runTotal += 1;
  });
  const averageStreak = runCount ? (runTotal / runCount).toFixed(1) : '0';
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const thisMonthHistory = habit.history.filter((date) => monthKey(date) === currentMonthKey);
  const monthPeriods = habit.frequency === 'weekly'
    ? [...new Set(thisMonthHistory.map((date) => getLocalWeekDates(date)[0]))].sort()
    : thisMonthHistory;
  const streakResets = monthPeriods.reduce((resets, date, index) => {
    if (!index) return resets;
    const previous = monthPeriods[index - 1];
    const difference = getCalendarDayDifference(previous, date);
    return difference > (habit.frequency === 'weekly' ? 7 : 1) ? resets + 1 : resets;
  }, 0);

  return (
    <section className="habit-panel habit-stats" aria-labelledby="habit-stats-title">
      <div className="habit-panel__heading">
        <div><p className="habit-detail-eyebrow">YOUR MOMENTUM</p><h2 id="habit-stats-title">Progress & insights</h2></div>
      </div>
      <div className="habit-stats__charts">
        <div className="habit-stats__chart">
          <h3>This week</h3>
          <div className="habit-stats__bars" role="img" aria-label="Completions for each day this week">
            {weeklyValues.map((value, index) => (
              <div className="habit-stats__bar-wrap" key={weekDates[index]}>
                <span className={value ? 'is-filled' : ''} style={{ '--bar-height': value ? '100%' : '12%' }} />
                <small>{WEEKDAYS[index][0]}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="habit-stats__chart">
          <h3>Last 6 months</h3>
          <svg className="habit-stats__line" viewBox="0 0 360 140" role="img" aria-label="Monthly completion trend">
            <line x1="20" y1="112" x2="340" y2="112" />
            <polyline points={points} />
            {months.map((item, index) => (
              <g key={item.key}>
                <circle cx={20 + index * 64} cy={112 - (item.value / maxMonthly) * 84} r="4" />
                <text x={20 + index * 64} y="134">{item.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
      <div className="habit-stats__insights">
        <div><span>Best day of the week</span><strong>{bestDay.count ? bestDay.day : 'Building your data'}</strong></div>
        <div><span>Average streak length</span><strong>{averageStreak} {habit.frequency === 'weekly' ? 'weeks' : 'days'}</strong></div>
        <div><span>Streak resets this month</span><strong>{streakResets}</strong></div>
      </div>
    </section>
  );
}
