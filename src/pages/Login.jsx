import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

function getSignInErrorMessage(error) {
  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'The sign-in window was closed before you finished. Give it another try.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups and try again.';
    case 'auth/network-request-failed':
      return 'We couldn’t connect. Check your internet connection and try again.';
    default:
      return 'We couldn’t sign you in just now. Please try again in a moment.';
  }
}

export default function Login() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signInWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="auth-loading" role="status">Checking your sign-in…</div>;
  }
  if (isAuthenticated && !isSigningIn) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    setErrorMessage('');

    try {
      const { isNewUser } = await signInWithGoogle();
      navigate(isNewUser ? '/setup' : '/dashboard', { replace: true });
    } catch (error) {
      console.error('Google sign-in failed.', error);
      setErrorMessage(
        error.code
          ? getSignInErrorMessage(error)
          : error.message?.includes('Firebase is not configured')
            ? 'Sign-in isn’t set up yet. Please try again later.'
            : 'We couldn’t sign you in just now. Please try again in a moment.',
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-page__blob" aria-hidden="true" />
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card__brand" aria-label="Streak Counter">
          <svg className="login-card__flame" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.1 2.2c.4 3.2-1.1 4.7-2.7 6.4-1.4 1.5-2.8 3-2.8 5.5a7.4 7.4 0 0 0 14.8 0c0-3.4-2-6.1-5.7-8.6.1 2.1-.6 3.1-1.5 3.9.2-3.2-.5-5.4-2.1-7.2Zm.1 17.1a3.1 3.1 0 0 1-3.1-3.1c0-1.1.6-2 1.7-3.2.7-.7 1.4-1.5 1.9-2.6.8 1.4 1.1 2.6 1.1 3.9 1-.7 1.6-1.5 1.8-2.5.8 1.2 1.3 2.6 1.3 4.1a4.7 4.7 0 0 1-4.7 3.4Z" />
          </svg>
          <span>Streak Counter</span>
        </div>
        <h1 id="login-title">Small days.<br />Big streaks.</h1>
        <p className="login-card__tagline">Make space for the little things you want to keep doing.</p>
        <button
          className="login-card__google-button"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          aria-busy={isSigningIn}
        >
          {isSigningIn ? (
            <>
              <span className="login-card__spinner" aria-hidden="true" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <svg
                className="login-card__google-icon"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path fill="#4285F4" d="M48 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h13.49c-.59 3.03-2.26 5.6-4.78 7.33l7.73 6C44.95 38.02 48 31.84 48 24.55Z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.43-4.91 2.3-8.18 2.3-6.28 0-11.6-4.24-13.49-9.95l-7.98 6.19C6.5 42.62 14.62 48 24 48Z" />
                <path fill="#FBBC05" d="M10.51 28.55a14.4 14.4 0 0 1 0-9.1l-7.98-6.19a24 24 0 0 0 0 21.48l7.98-6.19Z" />
                <path fill="#EA4335" d="M24 9.5c3.53 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.5 5.38 2.53 13.26l7.98 6.19C12.4 13.74 17.72 9.5 24 9.5Z" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
        {errorMessage && (
          <p className="login-card__error" role="alert">{errorMessage}</p>
        )}
        <p className="login-card__footer">A gentler way to build consistency.</p>
      </section>
    </main>
  );
}
