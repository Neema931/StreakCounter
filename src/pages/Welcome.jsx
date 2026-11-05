import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import './Welcome.css';

function CharacterIllustration({ gender }) {
  if (gender === 'male') {
    return (
      <svg className="welcome-character" viewBox="0 0 240 260" role="img" aria-label="Friendly male cartoon character">
        <ellipse cx="120" cy="244" rx="68" ry="10" fill="#E9E2FD" />
        <path d="M66 239c2-42 20-67 54-67s52 25 54 67H66Z" fill="#B9A7F5" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <path d="M86 180c8 12 20 18 34 18s26-6 34-18l10 17c-11 17-26 25-44 25s-33-8-44-25l10-17Z" fill="#fff" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <path d="M94 163v17c7 12 16 18 26 18s19-6 26-18v-17H94Z" fill="#F3C6A7" stroke="#111" strokeWidth="4" />
        <path d="M76 89c0-35 19-56 44-56 29 0 47 21 47 56v37c0 31-20 51-47 51s-44-20-44-51V89Z" fill="#F3C6A7" stroke="#111" strokeWidth="4" />
        <path d="M72 105c-8-43 11-75 51-75 30 0 48 19 50 54l-14 3-10-19c-17 13-38 17-72 15l-5 24-7-2Z" fill="#111" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <path d="M93 111h13m29 0h13" stroke="#111" strokeWidth="4" strokeLinecap="round" />
        <path d="M102 143c10 9 25 9 36 0" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
        <path d="M97 125h2m42 0h2" stroke="#B36F74" strokeWidth="7" strokeLinecap="round" />
        <path d="m177 80 10-13m3 28 16-3" stroke="#8B73E0" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (gender === 'female') {
    return (
      <svg className="welcome-character" viewBox="0 0 240 260" role="img" aria-label="Friendly female cartoon character">
        <ellipse cx="120" cy="244" rx="68" ry="10" fill="#E9E2FD" />
        <path d="M66 239c2-42 20-67 54-67s52 25 54 67H66Z" fill="#B9A7F5" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <path d="M86 180c8 12 20 18 34 18s26-6 34-18l10 17c-11 17-26 25-44 25s-33-8-44-25l10-17Z" fill="#fff" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <path d="M94 163v17c7 12 16 18 26 18s19-6 26-18v-17H94Z" fill="#F3C6A7" stroke="#111" strokeWidth="4" />
        <path d="M76 92c0-37 18-58 45-58 30 0 47 22 47 58v45c0 27-16 42-27 48l-8-23c17-17 18-36 17-55-20 4-47 4-68-2 0 23 0 43 15 57l-7 23c-18-11-31-30-31-57V92Z" fill="#6B3F46" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <path d="M82 94c1-36 17-58 40-58 25 0 41 17 45 45-12-5-21-14-26-26-16 20-34 30-59 31Z" fill="#6B3F46" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <path d="M92 111h13m29 0h13" stroke="#111" strokeWidth="4" strokeLinecap="round" />
        <path d="M102 143c10 9 25 9 36 0" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
        <path d="M97 125h2m42 0h2" stroke="#B36F74" strokeWidth="7" strokeLinecap="round" />
        <path d="m177 80 10-13m3 28 16-3" stroke="#8B73E0" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="welcome-character welcome-character--mascot" viewBox="0 0 240 260" role="img" aria-label="Friendly lavender mascot">
      <ellipse cx="120" cy="244" rx="68" ry="10" fill="#E9E2FD" />
      <path d="M120 43c39 0 67 31 67 75 0 31-12 57-31 70l14 36c2 6-3 12-10 10l-40-18-40 18c-7 2-12-4-10-10l14-36c-19-13-31-39-31-70 0-44 28-75 67-75Z" fill="#B9A7F5" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
      <path d="M77 130c0-29 18-49 43-49s43 20 43 49-18 46-43 46-43-17-43-46Z" fill="#fff" stroke="#111" strokeWidth="4" />
      <path d="M96 126h2m44 0h2" stroke="#111" strokeWidth="5" strokeLinecap="round" />
      <path d="M104 145c9 8 23 8 32 0" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
      <path d="M91 137h2m54 0h2" stroke="#8B73E0" strokeWidth="7" strokeLinecap="round" />
      <path d="m60 83-8-12m125 11 10-11M120 24v-9" stroke="#8B73E0" strokeWidth="4" strokeLinecap="round" />
      <circle cx="120" cy="12" r="5" fill="#B9A7F5" />
    </svg>
  );
}

export default function Welcome() {
  const { profile } = useUser();
  const name = profile.username || profile.name || 'friend';
  const message = `Welcome, ${name}!`;
  const [typedLength, setTypedLength] = useState(0);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setTypedLength(message.length);
      setShowContinue(true);
      return undefined;
    }

    setTypedLength(0);
    setShowContinue(false);
    const typingTimer = window.setInterval(() => {
      setTypedLength((length) => {
        if (length >= message.length) {
          window.clearInterval(typingTimer);
          return length;
        }
        return length + 1;
      });
    }, 65);
    const buttonTimer = window.setTimeout(() => setShowContinue(true), 2000);

    return () => {
      window.clearInterval(typingTimer);
      window.clearTimeout(buttonTimer);
    };
  }, [message]);

  return (
    <main className="welcome-page">
      <Link className="welcome-page__skip" to="/dashboard">Skip</Link>
      <section className="welcome-page__content" aria-label="Welcome">
        <div className="welcome-page__speech" aria-label={message}>
          <span aria-hidden="true">{message.slice(0, typedLength)}</span>
          {typedLength < message.length && <span className="welcome-page__cursor" aria-hidden="true" />}
          <span className="sr-only">{message}</span>
        </div>
        <div className="welcome-page__character-wrap">
          <CharacterIllustration gender={profile.gender} />
        </div>
        <p className="welcome-page__note">Your next streak starts with one small step.</p>
        <div className="welcome-page__action-slot">
          {showContinue && (
            <Link className="welcome-page__continue" to="/dashboard">
              Let’s start my streaks <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
