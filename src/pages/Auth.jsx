import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import useUsernameAvailability from '../hooks/useUsernameAvailability.js';
import { getUsernameFormatError } from '../utils/usernames.js';
import './Auth.css';

const genders = [
  { value: 'male', label: 'Male', icon: '👨🏻‍🦱' },
  { value: 'female', label: 'Female', icon: '👩🏻‍🦰' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: '😊' },
];

function GoogleMark() {
  return (
    <svg className="auth-google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M48 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h13.49c-.59 3.03-2.26 5.6-4.78 7.33l7.73 6C44.95 38.02 48 31.84 48 24.55Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.43-4.91 2.3-8.18 2.3-6.28 0-11.6-4.24-13.49-9.95l-7.98 6.19C6.5 42.62 14.62 48 24 48Z" />
      <path fill="#FBBC05" d="M10.51 28.55a14.4 14.4 0 0 1 0-9.1l-7.98-6.19a24 24 0 0 0 0 21.48l7.98-6.19Z" />
      <path fill="#EA4335" d="M24 9.5c3.53 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.5 5.38 2.53 13.26l7.98 6.19C12.4 13.74 17.72 9.5 24 9.5Z" />
    </svg>
  );
}

function FlameMark() {
  return (
    <svg className="auth-brand__flame" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.2 1.8c.5 4-1.3 5.9-3.1 7.7-1.7 1.8-3.4 3.6-3.4 6.6a7.3 7.3 0 0 0 14.6 0c0-4-2.3-7.3-6.8-10.2.2 2.5-.7 3.8-1.8 4.7.3-4-.6-6.6-2.5-8.8-.4-.4-.8-.4-1 0Z" />
      <path d="M13.2 21a3.3 3.3 0 0 1-3.3-3.3c0-1.2.6-2.1 1.8-3.4.7-.8 1.5-1.7 2-2.9.9 1.6 1.2 2.9 1.2 4.4 1.1-.8 1.7-1.7 1.9-2.8.9 1.3 1.4 2.8 1.4 4.5a5 5 0 0 1-5 3.5Z" />
    </svg>
  );
}

function getFriendlyError(error, stage) {
  if (error.code === 'auth/popup-closed-by-user') {
    return 'The Google sign-in window was closed. You can try again whenever you’re ready.';
  }
  if (error.code === 'auth/popup-blocked') {
    return 'Your browser blocked the sign-in window. Allow pop-ups and try again.';
  }
  if (error.code === 'auth/network-request-failed') {
    return 'We couldn’t connect. Check your internet connection and try again.';
  }
  if (error.code === 'auth/username-already-taken') {
    return 'That username was just taken. Please choose another one.';
  }
  if (error.code === 'auth/weak-password') {
    return 'Choose a password with at least 8 characters, including a letter and a number.';
  }
  if (stage === 'login') {
    return 'Incorrect username or password.';
  }
  return error.message?.includes('Firebase is not configured')
    ? 'Authentication isn’t configured yet. Please try again later.'
    : 'We couldn’t complete that just now. Please try again.';
}

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const mode = requestedMode === 'login' ? 'login' : 'signup';
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle, createGoogleProfile, signInWithUsername, resetPasswordForUsername, logout } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [hasEditedUsername, setHasEditedUsername] = useState(false);
  const usernameError = getUsernameFormatError(username);
  const usernameAvailability = useUsernameAvailability(
    username,
    mode === 'signup' && Boolean(user),
  );
  const usernameValid = !usernameError && usernameAvailability.status === 'available';
  const passwordValid = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  const passwordsMatch = Boolean(confirmPassword) && password === confirmPassword;
  const profileValid = usernameValid && passwordValid && passwordsMatch && genders.some((item) => item.value === gender);
  const profileIsComplete = Boolean(profile.username && profile.gender);
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    return [
      password.length >= 8,
      /[A-Za-z]/.test(password),
      /\d/.test(password),
      password.length >= 12 || /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
  }, [password]);

  function switchMode(nextMode) {
    setErrorMessage('');
    setNotice('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setGender('');
    setHasEditedUsername(false);
    setSearchParams({ mode: nextMode });
  }

  async function handleGoogleSignIn() {
    setIsBusy(true);
    setErrorMessage('');
    setNotice('');
    try {
      const result = await signInWithGoogle();
      if (result.hasProfile && result.profile?.username && result.profile?.gender) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setUsername(result.profile?.username || '');
      setGender(result.profile?.gender || '');
      setPassword('');
      setConfirmPassword('');
      setHasEditedUsername(false);
    } catch (error) {
      console.error('Google sign-in failed.', error);
      setErrorMessage(getFriendlyError(error, 'signup'));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateAccount(event) {
    event.preventDefault();
    if (!profileValid || isBusy) return;

    setIsBusy(true);
    setErrorMessage('');
    setNotice('');
    try {
      await createGoogleProfile({ username: username.trim(), password, gender });
      await updateProfile({
        username: username.trim(),
        name: username.trim(),
        gender,
        email: user.email,
      });
      navigate('/welcome', { replace: true });
    } catch (error) {
      console.error('Account profile creation failed.', error);
      setErrorMessage(getFriendlyError(error, 'signup'));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (isBusy || !username.trim() || !password) return;

    setIsBusy(true);
    setErrorMessage('');
    setNotice('');
    try {
      await signInWithUsername(username, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Username login failed.', error);
      setErrorMessage('Incorrect username or password.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleForgotPassword() {
    setErrorMessage('');
    setNotice('');
    if (!username.trim()) {
      setErrorMessage('Enter your username first so we know where to send the reset link.');
      return;
    }

    setIsBusy(true);
    try {
      await resetPasswordForUsername(username);
      setNotice('If that username has an account, a password reset link is on its way.');
    } catch (error) {
      console.error('Password reset request failed.', error);
      setNotice('If that username has an account, a password reset link is on its way.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDifferentAccount() {
    setIsBusy(true);
    setErrorMessage('');
    try {
      await logout();
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setGender('');
      setHasEditedUsername(false);
    } catch (error) {
      console.error('Unable to switch accounts.', error);
      setErrorMessage('We couldn’t switch accounts. Please try again.');
    } finally {
      setIsBusy(false);
    }
  }

  if (!requestedMode) {
    return <Navigate to="/auth?mode=signup" replace />;
  }
  if (requestedMode !== 'signup' && requestedMode !== 'login') {
    return <Navigate to="/auth?mode=signup" replace />;
  }
  if (authLoading || (user && profileLoading)) {
    return <main className="auth-loading" role="status">Getting your account ready…</main>;
  }
  if (user && profileIsComplete) {
    return <Navigate to="/dashboard" replace />;
  }
  if (user && mode === 'login') {
    return <Navigate to="/dashboard" replace />;
  }

  const showingProfileStep = mode === 'signup' && Boolean(user);
  const title = showingProfileStep
    ? 'Create your account'
    : mode === 'signup'
      ? 'Create your account'
      : 'Welcome back';
  const subtitle = showingProfileStep || mode === 'signup'
    ? 'Start building streaks today.'
    : 'Log in to keep your streaks alive.';

  return (
    <main className={`auth-page auth-page--${mode}`}>
      <div className="auth-page__blob auth-page__blob--top" aria-hidden="true" />
      <div className="auth-page__blob auth-page__blob--bottom" aria-hidden="true" />
      <aside className="auth-hero" aria-label="Build habits. Keep the streak.">
        <div className="auth-hero__art" aria-hidden="true">
          <div className="auth-hero__flame">
            <FlameMark />
          </div>
          <span className="auth-hero__spark auth-hero__spark--one">✦</span>
          <span className="auth-hero__spark auth-hero__spark--two">✧</span>
        </div>
        <p>Build habits.<br />Keep the streak.</p>
      </aside>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className={`auth-card__content${showingProfileStep ? ' auth-card__content--profile' : ''}`} key={`${mode}-${showingProfileStep ? 'profile' : 'entry'}`}>
          <div className="auth-brand">
            <FlameMark />
            <span>Streak Counter</span>
          </div>

          {/* Step two sets credentials and profile details. */}
          {showingProfileStep && (
            <div className="auth-step">
              <span>STEP 2 OF 2</span>
              <p>
                Signed in as <a href={`mailto:${user.email}`}>{user.email}</a>
                <button type="button" onClick={handleDifferentAccount} disabled={isBusy}>Use a different account</button>
              </p>
            </div>
          )}

          <h1 id="auth-title">{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>

          <div aria-live="polite" className="auth-card__messages">
            {errorMessage && <p className="auth-message auth-message--error" role="alert">{errorMessage}</p>}
            {notice && <p className="auth-message auth-message--notice">{notice}</p>}
          </div>

          {/* Sign-up profile form */}
          {showingProfileStep ? (
            <form className="auth-form" onSubmit={handleCreateAccount} noValidate>
              <div className="auth-field">
                <label htmlFor="signup-username">Username</label>
                <div className="auth-field__input-wrap">
                  <input
                    id="signup-username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setHasEditedUsername(true);
                      setErrorMessage('');
                    }}
                    minLength={3}
                    maxLength={15}
                    placeholder="3–15 letters, numbers, or _"
                    aria-invalid={Boolean(usernameError || usernameAvailability.status === 'taken')}
                    aria-describedby="signup-username-feedback"
                  />
                  {usernameAvailability.status === 'available' && (
                    <span className="auth-field__valid-icon" aria-label="Username available">✓</span>
                  )}
                  {usernameAvailability.status === 'checking' && <span className="auth-field__checking" aria-hidden="true" />}
                </div>
                <p className={`auth-field__feedback${usernameError || usernameAvailability.status === 'taken' || usernameAvailability.status === 'error' ? ' is-error' : ''}`} id="signup-username-feedback" aria-live="polite">
                  {hasEditedUsername && usernameError
                    ? usernameError
                    : usernameAvailability.message}
                </p>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password">Password</label>
                <div className="auth-field__input-wrap">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    aria-describedby="signup-password-help signup-password-strength"
                  />
                  <button className="auth-field__toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="auth-field__feedback" id="signup-password-help" aria-live="polite">
                  Use at least 8 characters, including a letter and a number.
                </p>
                <div className="auth-strength" id="signup-password-strength" aria-label={`Password strength: ${passwordStrength} of 4`}>
                  {[0, 1, 2, 3].map((step) => (
                    <span className={passwordStrength > step ? 'is-filled' : ''} key={step} />
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-confirm-password">Confirm password</label>
                <div className="auth-field__input-wrap">
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Enter your password again"
                    aria-invalid={Boolean(confirmPassword && !passwordsMatch)}
                    aria-describedby="signup-confirm-feedback"
                  />
                  <button className="auth-field__toggle" type="button" onClick={() => setShowConfirmPassword((shown) => !shown)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className={`auth-field__feedback${confirmPassword && !passwordsMatch ? ' is-error' : ''}`} id="signup-confirm-feedback" aria-live="polite">
                  {confirmPassword && !passwordsMatch ? 'Passwords do not match.' : ''}
                </p>
              </div>

              <fieldset className="auth-gender">
                <legend>Gender</legend>
                <div className="auth-gender__options">
                  {genders.map((option) => (
                    <label className={`auth-gender__card${gender === option.value ? ' is-selected' : ''}`} key={option.value}>
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={gender === option.value}
                        onChange={() => setGender(option.value)}
                      />
                      <span className="auth-gender__icon" aria-hidden="true">{option.icon}</span>
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button className="auth-submit auth-submit--primary" type="submit" disabled={!profileValid || isBusy}>
                {isBusy ? <><span className="auth-spinner" aria-hidden="true" /> Creating account…</> : 'Create account'}
              </button>
            </form>
          ) : mode === 'signup' ? (
            // Sign-up entry point
            <div className="auth-entry">
              <button className="auth-google-button" type="button" onClick={handleGoogleSignIn} disabled={isBusy} aria-busy={isBusy}>
                {isBusy ? <><span className="auth-spinner" aria-hidden="true" /> Connecting...</> : <><GoogleMark /> Continue with Google</>}
              </button>
              <p className="auth-switch">
                Already have an account? <button type="button" onClick={() => switchMode('login')}>Log in</button>
              </p>
            </div>
          ) : (
            <form className="auth-form auth-form--login" onSubmit={handleLogin} noValidate>
              <div className="auth-field">
                <label htmlFor="login-username">Username</label>
                <input
                  id="login-username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Your username"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <div className="auth-field__input-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    required
                  />
                  <button className="auth-field__toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button className="auth-forgot" type="button" onClick={handleForgotPassword} disabled={isBusy}>
                Forgot password?
              </button>
              <button className="auth-submit auth-submit--primary" type="submit" disabled={!username.trim() || !password || isBusy}>
                {isBusy ? <><span className="auth-spinner" aria-hidden="true" /> Logging in…</> : 'Log in'}
              </button>

              <div className="auth-entry" style={{ marginTop: '12px' }}>
                <button className="auth-google-button" type="button" onClick={handleGoogleSignIn} disabled={isBusy} aria-busy={isBusy}>
                  {isBusy ? <><span className="auth-spinner" aria-hidden="true" /> Connecting...</> : <><GoogleMark /> Continue with Google</>}
                </button>
              </div>

              <p className="auth-switch">
                Don’t have an account? <button type="button" onClick={() => switchMode('signup')}>Sign up</button>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
