import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import habitContent from '../data/habitContent.json';
import useHabit from '../hooks/useHabit.js';
import { getLocalDate, isHabitCompletedForPeriod } from '../utils/streaks.js';
import HabitCalendar from '../components/habit-detail/HabitCalendar.jsx';
import StatsCharts from '../components/habit-detail/StatsCharts.jsx';
import GoalsReminders from '../components/habit-detail/GoalsReminders.jsx';
import HabitTools from '../components/habit-detail/HabitTools.jsx';
import ArticlesGrid from '../components/habit-detail/ArticlesGrid.jsx';
import MotivationCard from '../components/habit-detail/MotivationCard.jsx';
import NotesJournal from '../components/habit-detail/NotesJournal.jsx';
import StreakHero from '../components/habit-detail/StreakHero.jsx';
import CollapsibleSection from '../components/habit-detail/CollapsibleSection.jsx';
import './HabitPage.css';

function getContentKey(habit) {
  if (habit.contentKey && habitContent[habit.contentKey]) return habit.contentKey;
  const slug = habit.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (habitContent[slug]) return slug;
  if (slug.includes('drink') || slug.includes('water')) return 'drinking-water';
  if (slug.includes('save') || slug.includes('money')) return 'saving-money';
  if (slug.includes('language')) return 'learning-a-language';
  return 'custom';
}

function HabitSkeleton() {
  return (
    <main className="habit-detail habit-detail--skeleton" aria-busy="true" aria-label="Loading habit">
      <div className="habit-skeleton habit-skeleton--header" />
      <div className="habit-skeleton habit-skeleton--hero" />
      <div className="habit-detail-layout" key={habit.id}>
        <div className="habit-skeleton habit-skeleton--panel" />
        <div className="habit-skeleton habit-skeleton--panel" />
      </div>
    </main>
  );
}

export default function HabitPage() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const { habit, loading, loadError, saving, saveHabit, markDone, undoLastCheckIn, updateDay, removeHabit } = useHabit(habitId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState('');
  const [celebrating, setCelebrating] = useState(false);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!habit) return undefined;
    const sections = document.querySelectorAll('.habit-reveal');
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [habit]);

  useEffect(() => {
    function closeMenu(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener('keydown', closeMenu);
    return () => document.removeEventListener('keydown', closeMenu);
  }, []);

  const content = useMemo(() => habit ? habitContent[getContentKey(habit)] ?? habitContent.custom : habitContent.custom, [habit]);
  if (loading) return <HabitSkeleton />;
  if (loadError) {
    return <main className="habit-detail-state"><h1>We couldn’t load your habit</h1><p>{loadError}</p><Link to="/dashboard">Back to dashboard</Link></main>;
  }
  if (!habit) {
    return (
      <main className="habit-detail-state">
        <span aria-hidden="true">🌱</span>
        <h1>Habit not found</h1>
        <p>It may have been removed from your list. Your other habits are still here.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </main>
    );
  }

  const completed = isHabitCompletedForPeriod(habit, getLocalDate());
  const undoAvailable = Boolean(habit.undoSnapshot?.expiresAt && habit.undoSnapshot.expiresAt > clock);
  const undoCheckIn = async () => {
    try {
      await undoLastCheckIn();
      setActionError('');
    } catch (error) {
      console.error('Unable to undo habit check-in.', error);
      setActionError('We couldn’t undo that check-in. Please try again.');
    }
  };

  async function handleMarkDone() {
    try {
      const updated = await markDone();
      setActionError('');
      const currentMilestoneDays = updated?.currentStreak * (habit.frequency === 'weekly' ? 7 : 1);
      const previousMilestoneDays = habit.currentStreak * (habit.frequency === 'weekly' ? 7 : 1);
      if (updated && [7, 30, 100].includes(currentMilestoneDays) && currentMilestoneDays > previousMilestoneDays) {
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), 1800);
      }
      return updated;
    } catch (error) {
      console.error('Unable to mark the habit complete.', error);
      setActionError('We couldn’t save your check-in. Please try again.');
      return null;
    }
  }

  async function saveUpdates(updates) {
    try {
      await saveHabit(updates);
      setActionError('');
      return true;
    } catch (error) {
      console.error('Unable to save habit details.', error);
      setActionError('We couldn’t save that change. Please try again.');
      return false;
    }
  }

  async function saveName(event) {
    event.preventDefault();
    const name = nameDraft.trim();
    if (!name) return;
    if (await saveUpdates({ name })) setEditing(false);
  }

  async function saveDay(date, completedDay, note) {
    try {
      await updateDay(date, completedDay, note);
      setActionError('');
      return true;
    } catch (error) {
      console.error('Unable to save habit day details.', error);
      setActionError('We couldn’t save that date. Please try again.');
      return false;
    }
  }

  async function deleteHabit() {
    try {
      await removeHabit();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Unable to delete habit.', error);
      setActionError('We couldn’t delete this habit. Please try again.');
      setConfirmDelete(false);
    }
  }

  return (
    <div className="habit-detail-page">
      <header className="habit-detail-header">
        <Link className="habit-detail-header__back" to="/dashboard"><span aria-hidden="true">←</span> Back to dashboard</Link>
        <div className="habit-detail-header__title">
          <span aria-hidden="true">{habit.icon}</span>
          {editing ? (
            <form onSubmit={saveName}>
              <label className="sr-only" htmlFor="habit-name-edit">Habit name</label>
              <input id="habit-name-edit" autoFocus maxLength="50" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} />
              <button type="submit" disabled={saving}>Save</button>
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
            </form>
          ) : <h1>{habit.name}</h1>}
        </div>
        <div className="habit-detail-header__options">
          <button type="button" aria-label="Habit options" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>•••</button>
          {menuOpen && (
            <div className="habit-detail-header__menu" role="menu">
              <button role="menuitem" type="button" onClick={() => { setNameDraft(habit.name); setEditing(true); setMenuOpen(false); }}>Edit name</button>
              <button role="menuitem" type="button" onClick={() => { saveUpdates({ paused: !habit.paused }); setMenuOpen(false); }}>
                {habit.paused ? 'Resume habit' : 'Pause habit'}
              </button>
              <button role="menuitem" type="button" className="is-danger" onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}>Delete habit</button>
            </div>
          )}
        </div>
      </header>

      <main className="habit-detail">
        {actionError && <p className="habit-detail__error" role="alert">{actionError}</p>}
        {habit.paused && <p className="habit-detail__paused" role="status">This habit is paused. Resume it from the options menu when you’re ready.</p>}
        <div className="habit-detail-layout">
          <div className="habit-detail-column">
            <div className="habit-reveal">
              <CollapsibleSection title="Streak overview">
                <StreakHero
                  habit={habit}
                  completed={completed}
                  saving={saving}
                  onMarkDone={handleMarkDone}
                  onUndo={undoCheckIn}
                  undoAvailable={undoAvailable}
                  celebrating={celebrating}
                />
              </CollapsibleSection>
            </div>
            <div className="habit-reveal"><CollapsibleSection title="Calendar"><HabitCalendar habit={habit} onUpdateDay={saveDay} saving={saving} /></CollapsibleSection></div>
            <div className="habit-reveal"><CollapsibleSection title="Progress & insights"><StatsCharts habit={habit} /></CollapsibleSection></div>
            <div className="habit-reveal"><CollapsibleSection title="Journal & notes"><NotesJournal habit={habit} onUpdateDay={saveDay} saving={saving} /></CollapsibleSection></div>
          </div>
          <div className="habit-detail-column">
            <div className="habit-reveal"><CollapsibleSection title="Goals & reminders"><GoalsReminders habit={habit} onSave={saveUpdates} saving={saving} /></CollapsibleSection></div>
            <div className="habit-reveal"><CollapsibleSection title="Habit tools"><HabitTools habit={habit} content={content} onSave={saveUpdates} saving={saving} /></CollapsibleSection></div>
            <div className="habit-reveal"><CollapsibleSection title="Articles & tips"><ArticlesGrid habitName={habit.name} content={content} /></CollapsibleSection></div>
          </div>
          <div className="habit-reveal habit-detail-full"><CollapsibleSection title="Motivation"><MotivationCard habit={habit} quote={content.quote} onSave={saveUpdates} saving={saving} /></CollapsibleSection></div>
        </div>
      </main>

      <div className="habit-mobile-checkin">
        <button type="button" disabled={completed || saving || habit.paused} onClick={handleMarkDone}>
          {completed ? '✓ Done for today' : saving ? 'Saving…' : habit.frequency === 'weekly' ? 'Mark done this week' : 'Mark done today'}
        </button>
      </div>

      {confirmDelete && (
        <div className="habit-delete-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setConfirmDelete(false);
        }}>
          <section className="habit-delete-modal" role="dialog" aria-modal="true" aria-labelledby="habit-delete-title">
            <h2 id="habit-delete-title">Delete {habit.name}?</h2>
            <p>This removes the habit and its saved history from your profile. This can’t be undone.</p>
            <div><button type="button" onClick={() => setConfirmDelete(false)}>Keep habit</button><button type="button" onClick={deleteHabit}>Delete habit</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
