import { useEffect, useState } from 'react';
import { getLocalDate } from '../../utils/streaks.js';
import './HabitTools.css';

function ToolField({ label, value, onChange, type = 'text', ...props }) {
  return (
    <label className="habit-tool__field">
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  );
}

export default function HabitTools({ habit, content, onSave, saving }) {
  const tool = content.tool ?? 'generic';
  const data = habit.toolData ?? {};
  const today = getLocalDate();
  const [values, setValues] = useState(data);
  const [timer, setTimer] = useState(data.timerSeconds ?? (tool === 'study' ? 25 * 60 : 5 * 60));
  const [running, setRunning] = useState(false);
  const [confirmSlip, setConfirmSlip] = useState(false);
  const [notice, setNotice] = useState('');
  const [journalEntry, setJournalEntry] = useState(data.entry ?? '');
  const [customNote, setCustomNote] = useState(data.note ?? '');

  useEffect(() => {
    const stored = habit.toolData ?? {};
    setValues(stored.toolDate === today
      ? stored
      : {
        ...stored,
        toolDate: today,
        glasses: 0,
        pagesToday: 0,
        pagesLoggedToday: 0,
        amountToday: 0,
        amountLoggedToday: 0,
        sessionsToday: 0,
        progress: 0,
      });
  }, [habit.toolData, today]);

  useEffect(() => {
    setJournalEntry(habit.toolData?.entry ?? '');
    setCustomNote(habit.toolData?.note ?? '');
    setTimer(habit.toolData?.timerSeconds ?? (tool === 'study' ? 25 * 60 : 5 * 60));
    setRunning(false);
    setNotice('');
    setConfirmSlip(false);
  }, [habit.id]);

  useEffect(() => {
    if (!running) return undefined;
    const timerId = window.setInterval(() => {
      setTimer((seconds) => {
        if (seconds <= 1) {
          setRunning(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [running]);

  async function saveData(updates) {
    const next = { ...values, ...updates, toolDate: today };
    const saved = await onSave({ toolData: next });
    setValues(saved === false ? (habit.toolData ?? {}) : next);
    return saved !== false;
  }

  async function saveJournal() {
    await saveData({ entry: journalEntry, entryDate: getLocalDate() });
    setNotice('Your entry is saved.');
  }

  async function addWater() {
    const glasses = Number(values.glasses ?? 0) + 1;
    await saveData({ glasses, progress: glasses });
  }

  async function logReading() {
    const pages = Math.max(0, Number(values.pagesToday ?? 0));
    const alreadyLogged = Number(values.pagesLoggedToday ?? 0);
    await saveData({
      pagesToday: pages,
      pagesLoggedToday: pages,
      totalPages: Number(values.totalPages ?? 0) + Math.max(0, pages - alreadyLogged),
      progress: pages,
      book: values.book ?? '',
    });
  }

  async function logSaving() {
    const amount = Math.max(0, Number(values.amountToday ?? 0));
    const alreadyLogged = Number(values.amountLoggedToday ?? 0);
    await saveData({
      amountToday: amount,
      amountLoggedToday: amount,
      totalSaved: Number(values.totalSaved ?? 0) + Math.max(0, amount - alreadyLogged),
      progress: amount,
    });
  }

  async function logSleep() {
    await saveData({
      bedtime: values.bedtime ?? '',
      wakeTime: values.wakeTime ?? '',
      sleepLogDate: getLocalDate(),
    });
  }

  async function logWorkout() {
    const duration = Math.max(0, Number(values.duration ?? 0));
    const workouts = Array.isArray(values.workouts) ? values.workouts : [];
    await saveData({
      workouts: [{ date: getLocalDate(), type: values.type || 'Workout', duration }, ...workouts].slice(0, 30),
      progress: duration,
    });
    setNotice('Workout logged. Nice work!');
  }

  async function logStudy() {
    const sessions = (Number(values.sessionsToday) || 0) + 1;
    await saveData({ sessionsToday: sessions, progress: sessions, subject: values.subject ?? '' });
  }

  async function logSlip() {
    const today = getLocalDate();
    const history = habit.history.filter((date) => date !== today);
    const saved = await onSave({
      history,
      currentStreak: 0,
      lastCompletedDate: history.at(-1) ?? null,
      toolData: { ...values, slips: (Number(values.slips) || 0) + 1, lastSlipDate: today },
    });
    if (saved === false) return;
    setConfirmSlip(false);
    setNotice('One moment does not define your progress. You can begin again.');
  }

  async function saveGeneric() {
    await saveData({ counter: Math.max(0, Number(values.counter) || 0), note: customNote });
    setNotice('Your progress is saved.');
  }

  const titleMap = {
    workout: 'Workout log',
    reading: 'Reading tracker',
    water: 'Water check-in',
    meditation: 'Breathing timer',
    sleep: 'Sleep log',
    study: 'Focus timer',
    clean: 'Keep your intention',
    journal: 'Today’s journal',
    saving: 'Savings tracker',
    generic: 'Your habit toolkit',
  };
  const title = titleMap[tool] ?? titleMap.generic;
  const formattedTimer = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  return (
    <section className="habit-panel habit-tools" aria-labelledby="habit-tools-title">
      <div className="habit-panel__heading">
        <div><p className="habit-detail-eyebrow">A LITTLE EXTRA SUPPORT</p><h2 id="habit-tools-title">{title}</h2></div>
      </div>
      <div className="habit-tool" aria-live="polite">
        {tool === 'workout' && (
          <>
            <label className="habit-tool__field"><span>Workout type</span>
              <select value={values.type ?? 'Walk'} onChange={(event) => setValues({ ...values, type: event.target.value })}>
                {['Walk', 'Run', 'Strength', 'Yoga', 'Cycling', 'Other'].map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <ToolField label="Duration (minutes)" type="number" min="1" value={values.duration ?? 30} onChange={(value) => setValues({ ...values, duration: value })} />
            <div className="habit-tool__timer-row">
              <strong>{formattedTimer}</strong>
              <button type="button" onClick={() => setRunning((value) => !value)}>{running ? 'Pause timer' : 'Start timer'}</button>
              <button type="button" onClick={() => { setRunning(false); setTimer(0); }}>Reset</button>
            </div>
            <button type="button" className="habit-tool__primary" disabled={saving} onClick={logWorkout}>Log workout</button>
            <p className="habit-tool__muted">Recent workouts: {Array.isArray(values.workouts) ? values.workouts.length : 0}</p>
          </>
        )}

        {tool === 'reading' && (
          <>
            <ToolField label="Currently reading" value={values.book ?? ''} onChange={(book) => setValues({ ...values, book })} placeholder="Book title" />
            <ToolField label="Pages read today" type="number" min="0" value={values.pagesToday ?? ''} onChange={(pagesToday) => setValues({ ...values, pagesToday })} />
            <p className="habit-tool__muted">Pages tracked so far: {Number(values.totalPages ?? 0)}</p>
            <button className="habit-tool__primary" disabled={saving} type="button" onClick={logReading}>Save reading</button>
          </>
        )}

        {tool === 'water' && (
          <>
            <div className="habit-tool__water" aria-label={`${Number(values.glasses ?? 0)} glasses logged`}>
              <div style={{ height: `${Math.min(100, Number(values.glasses ?? 0) * 12.5)}%` }} />
              <span>💧</span>
            </div>
            <p className="habit-tool__water-count"><strong>{Number(values.glasses ?? 0)}</strong> glasses today</p>
            <button className="habit-tool__primary" disabled={saving} type="button" onClick={addWater}>＋ Add a glass</button>
            <button className="habit-tool__text-button" type="button" onClick={() => saveData({ glasses: Math.max(0, Number(values.glasses ?? 0) - 1), progress: Math.max(0, Number(values.glasses ?? 0) - 1) })}>Remove one</button>
          </>
        )}

        {tool === 'meditation' && (
          <>
            <div className={`habit-tool__breath${running ? ' is-breathing' : ''}`} aria-hidden="true"><span>{formattedTimer}</span></div>
            <p className="habit-tool__muted">Breathe in as the circle grows, out as it softens.</p>
            <div className="habit-tool__timer-row">
              <button type="button" onClick={() => setRunning((value) => !value)}>{running ? 'Pause' : timer ? 'Begin breathing' : 'Start again'}</button>
              <button type="button" onClick={() => { setRunning(false); setTimer(5 * 60); }}>Reset</button>
            </div>
          </>
        )}

        {tool === 'sleep' && (
          <>
            <ToolField label="Bedtime" type="time" value={values.bedtime ?? '22:30'} onChange={(bedtime) => setValues({ ...values, bedtime })} />
            <ToolField label="Wake time" type="time" value={values.wakeTime ?? '07:00'} onChange={(wakeTime) => setValues({ ...values, wakeTime })} />
            <button className="habit-tool__primary" disabled={saving} type="button" onClick={logSleep}>Save sleep log</button>
            {values.sleepLogDate && <p className="habit-tool__muted">Last logged {values.sleepLogDate}</p>}
          </>
        )}

        {tool === 'study' && (
          <>
            <ToolField label="Subject or language" value={values.subject ?? ''} onChange={(subject) => setValues({ ...values, subject })} placeholder="e.g. Biology" />
            <div className="habit-tool__timer-row"><strong>{formattedTimer}</strong><button type="button" onClick={() => setRunning((value) => !value)}>{running ? 'Pause focus' : 'Start 25 min focus'}</button><button type="button" onClick={() => { setRunning(false); setTimer(25 * 60); }}>Reset</button></div>
            <p className="habit-tool__muted">Focus sessions logged: {Number(values.sessionsToday ?? 0)}</p>
            <button className="habit-tool__primary" disabled={saving} type="button" onClick={logStudy}>Log a session</button>
          </>
        )}

        {tool === 'clean' && (
          <>
            <div className="habit-tool__clean-count"><span aria-hidden="true">🌱</span><strong>{habit.currentStreak}</strong><small>days on your current path</small></div>
            <p className="habit-tool__muted">Slips are information, not failure. Your previous check-in history stays here.</p>
            {confirmSlip ? (
              <div className="habit-tool__confirm">
                <p>Would you like to reset this streak and start fresh?</p>
                <button type="button" onClick={logSlip}>Yes, reset kindly</button>
                <button type="button" onClick={() => setConfirmSlip(false)}>Not now</button>
              </div>
            ) : <button className="habit-tool__text-button" type="button" onClick={() => setConfirmSlip(true)}>I slipped</button>}
          </>
        )}

        {tool === 'journal' && (
          <>
            <p className="habit-tool__prompt">Prompt: What is one small thing you noticed today?</p>
            <textarea rows="5" maxLength="2000" value={journalEntry} onChange={(event) => setJournalEntry(event.target.value)} placeholder="Write freely; one sentence is enough." />
            <button className="habit-tool__primary" type="button" disabled={saving || !journalEntry.trim()} onClick={saveJournal}>Save today's entry</button>
          </>
        )}

        {tool === 'saving' && (
          <>
            <ToolField label="Amount saved today" type="number" min="0" step="0.01" value={values.amountToday ?? ''} onChange={(amountToday) => setValues({ ...values, amountToday })} />
            <ToolField label="Savings goal" type="number" min="1" step="0.01" value={values.savingsGoal ?? ''} onChange={(savingsGoal) => setValues({ ...values, savingsGoal })} />
            <div className="habit-tool__money-progress" role="progressbar" aria-label="Savings goal progress" aria-valuenow={Math.min(100, Math.round((Number(values.totalSaved ?? 0) / Math.max(1, Number(values.savingsGoal ?? 1))) * 100))} aria-valuemin="0" aria-valuemax="100">
              <span style={{ width: `${Math.min(100, (Number(values.totalSaved ?? 0) / Math.max(1, Number(values.savingsGoal ?? 1))) * 100)}%` }} />
            </div>
            <p className="habit-tool__muted">Saved so far: {Number(values.totalSaved ?? 0).toFixed(2)}</p>
            <button className="habit-tool__primary" type="button" disabled={saving} onClick={logSaving}>Add to savings</button>
          </>
        )}

        {tool === 'generic' && (
          <>
            <ToolField label="Counter" type="number" min="0" value={values.counter ?? 0} onChange={(counter) => setValues({ ...values, counter })} />
            <label className="habit-tool__field"><span>Quick note</span><textarea rows="3" maxLength="500" value={customNote} onChange={(event) => setCustomNote(event.target.value)} placeholder="Anything you want to remember?" /></label>
            <button className="habit-tool__primary" type="button" disabled={saving} onClick={saveGeneric}>Save progress</button>
          </>
        )}
      </div>
      <p className="habit-tool__notice" role="status">{notice}</p>
    </section>
  );
}
