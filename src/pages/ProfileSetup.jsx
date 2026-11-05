import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import Button from '../components/Button.jsx';
import './ProfileSetup.css';

const genderOptions = [
  { value: 'male', label: 'Male', icon: '👨🏻‍🦱' },
  { value: 'female', label: 'Female', icon: '👩🏻‍🦰' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: '😊' },
];

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,15}$/;

function getUsernameError(username) {
  if (!username) return 'Enter a username to continue.';
  if (username.length < 3 || username.length > 15) {
    return 'Username must be 3 to 15 characters.';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Use letters, numbers, and underscores only.';
  }
  return '';
}

export default function ProfileSetup() {
  const { profile, updateProfile, loading, loadError } = useUser();
  const [username, setUsername] = useState(profile.username || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [hasEditedUsername, setHasEditedUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const navigate = useNavigate();
  const usernameError = getUsernameError(username);
  const isValid = !usernameError && genderOptions.some((option) => option.value === gender);

  useEffect(() => {
    if (!loading) {
      setUsername(profile.username || '');
      setGender(profile.gender || '');
    }
  }, [loading, profile.username, profile.gender]);

  if (loading) {
    return <div className="auth-loading" role="status">Loading your profile…</div>;
  }

  if (loadError) {
    return <p className="auth-loading" role="alert">{loadError}</p>;
  }

  if (profile.username && genderOptions.some((option) => option.value === profile.gender)) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isValid || isSaving) return;

    setIsSaving(true);
    setSaveError('');
    try {
      await updateProfile({ name: username, username, gender });
      navigate('/welcome', { replace: true });
    } catch (error) {
      console.error('Unable to save profile setup.', error);
      setSaveError('We couldn’t save your details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="setup-page">
      <section className="setup-page__content" aria-labelledby="setup-title">
        <p className="setup-page__step">STEP 1 OF 2</p>
        <h1 id="setup-title">Let’s set you up</h1>
        <p className="setup-page__intro">Make your space yours. You can always change this later.</p>

        <form className="setup-form" onSubmit={handleSubmit} noValidate>
          <div className="setup-form__field">
            <label htmlFor="username">Choose a username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setHasEditedUsername(true);
                setSaveError('');
              }}
              placeholder="e.g. sunny_streak"
              minLength={3}
              maxLength={15}
              aria-invalid={Boolean(usernameError && hasEditedUsername)}
              aria-describedby="username-help username-error"
            />
            <p className="setup-form__help" id="username-help">
              3–15 characters. Letters, numbers, and underscores.
            </p>
            <p
              className={`setup-form__validation${usernameError && hasEditedUsername ? ' is-error' : ''}`}
              id="username-error"
              aria-live="polite"
            >
              {hasEditedUsername && usernameError}
            </p>
          </div>

          <fieldset className="setup-form__gender">
            <legend>How do you identify?</legend>
            <div className="setup-form__gender-options">
              {genderOptions.map((option) => (
                <label
                  className={`gender-card${gender === option.value ? ' is-selected' : ''}`}
                  key={option.value}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={gender === option.value}
                    onChange={() => {
                      setGender(option.value);
                      setSaveError('');
                    }}
                  />
                  <span className="gender-card__icon" aria-hidden="true">{option.icon}</span>
                  <span className="gender-card__label">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {saveError && <p className="setup-form__error" role="alert">{saveError}</p>}
          <Button className="setup-form__continue" type="submit" disabled={!isValid || isSaving}>
            {isSaving ? 'Saving…' : 'Continue'}
            {!isSaving && <span aria-hidden="true">→</span>}
          </Button>
        </form>
      </section>
    </main>
  );
}
