import { useEffect, useRef, useState } from 'react';
import './HabitPicker.css';

export const presetHabits = [
  { name: 'Exercise', icon: '🏃' },
  { name: 'Reading', icon: '📚' },
  { name: 'Drinking water', icon: '💧' },
  { name: 'Meditation', icon: '🧘' },
  { name: 'Sleeping early', icon: '🌙' },
  { name: 'Studying', icon: '✏️' },
  { name: 'No social media', icon: '📵' },
  { name: 'No sugar', icon: '🍓' },
  { name: 'Journaling', icon: '📓' },
  { name: 'Learning a language', icon: '🌎' },
  { name: 'Praying', icon: '🙏' },
  { name: 'Saving money', icon: '🐷' },
];

const customIcons = ['✨', '🔥', '🌱', '🎯', '💜', '☀️', '🎨', '🧠'];
const customFrequencies = ['daily', 'weekly'];

function createId(name) {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'habit'}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export default function HabitPicker({ habits = [], onAdd, saving = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState(customIcons[0]);
  const [frequency, setFrequency] = useState('daily');
  const [error, setError] = useState('');
  const customCardRef = useRef(null);
  const dialogRef = useRef(null);
  const savingRef = useRef(saving);
  savingRef.current = saving;
  const addedNames = new Set(habits.map((habit) => habit.name.toLowerCase()));

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const dialog = dialogRef.current;
    const firstInput = dialog?.querySelector('#custom-habit-name');
    firstInput?.focus();

    function handleDialogKeyDown(event) {
      if (event.key === 'Escape' && !savingRef.current) {
        setIsModalOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const focusableElements = [...dialog.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
      )].filter((element) => element.type !== 'hidden');
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      customCardRef.current?.focus();
    };
  }, [isModalOpen]);

  async function addHabit(habit) {
    try {
      await onAdd({
        ...habit,
        id: createId(habit.name),
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        history: [],
      });
      setError('');
      return true;
    } catch (saveError) {
      console.error('Unable to add habit.', saveError);
      setError('We couldn’t save that habit. Please try again.');
      return false;
    }
  }

  async function handleCustomSubmit(event) {
    event.preventDefault();
    const name = customName.trim();
    if (!name) {
      setError('Enter a name for your habit.');
      return;
    }
    if (addedNames.has(name.toLowerCase())) {
      setError('That habit is already on your list.');
      return;
    }

    const saved = await addHabit({ name, icon: customIcon, frequency });
    if (saved) {
      setCustomName('');
      setIsModalOpen(false);
    }
  }

  return (
    <div className="habit-picker">
      <div className="habit-picker__grid">
        {presetHabits.map((habit) => {
          const isAdded = addedNames.has(habit.name.toLowerCase());
          return (
            <article className={`habit-picker__card${isAdded ? ' is-added' : ''}`} key={habit.name}>
              {isAdded && (
                <span className="habit-picker__selected-badge" aria-label="Selected">
                  <span aria-hidden="true">✓</span>
                </span>
              )}
              <span className="habit-picker__icon" aria-hidden="true">{habit.icon}</span>
              <span className="habit-picker__name">{habit.name}</span>
              <button
                className="habit-picker__add"
                type="button"
                disabled={isAdded || saving}
                onClick={() => addHabit({ ...habit, frequency: 'daily' })}
              >
                {isAdded ? 'Added' : 'Add'}
              </button>
            </article>
          );
        })}
        <button
          ref={customCardRef}
          className="habit-picker__custom-card"
          type="button"
          onClick={() => {
            setError('');
            setIsModalOpen(true);
          }}
        >
          <span aria-hidden="true">＋</span>
          <span> Add custom habit</span>
        </button>
      </div>

      {isModalOpen && (
        <div
          className="habit-modal__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setIsModalOpen(false);
          }}
        >
          <section
            ref={dialogRef}
            className="habit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="habit-modal-title"
            aria-describedby="habit-modal-description"
          >
            <button
              className="habit-modal__close"
              type="button"
              aria-label="Close"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              ×
            </button>
            <p className="eyebrow">MAKE IT YOURS</p>
            <h2 id="habit-modal-title">Add a custom habit</h2>
            <p className="sr-only" id="habit-modal-description">
              Choose a name, icon, and frequency for your custom habit.
            </p>
            <form onSubmit={handleCustomSubmit}>
              <label className="habit-modal__label" htmlFor="custom-habit-name">Habit name</label>
              <input
                id="custom-habit-name"
                className="habit-modal__input"
                autoFocus
                maxLength={50}
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="e.g. Take a daily walk"
                required
              />
              <fieldset className="habit-modal__icon-picker">
                <legend className="habit-modal__label">Pick an icon</legend>
                <div className="habit-modal__icons">
                  {customIcons.map((icon) => (
                    <label className={`habit-modal__icon-choice${icon === customIcon ? ' is-selected' : ''}`} key={icon}>
                      <input
                        type="radio"
                        name="custom-icon"
                        value={icon}
                        checked={icon === customIcon}
                        onChange={() => setCustomIcon(icon)}
                      />
                      <span aria-hidden="true">{icon}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="habit-modal__frequency">
                <legend className="habit-modal__label">Frequency</legend>
                <div className="habit-modal__frequencies">
                  {customFrequencies.map((value) => (
                    <label className={`habit-modal__frequency-option${frequency === value ? ' is-selected' : ''}`} key={value}>
                      <input
                        type="radio"
                        name="custom-frequency"
                        value={value}
                        checked={frequency === value}
                        onChange={() => setFrequency(value)}
                      />
                      {value === 'daily' ? 'Every day' : 'Every week'}
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && <p className="habit-modal__error" role="alert">{error}</p>}
              <button className="habit-modal__submit" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add habit'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
