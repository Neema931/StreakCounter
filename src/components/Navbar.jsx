import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import Avatar from './Avatar.jsx';
import './Navbar.css';

export default function Navbar() {
  const { logout } = useAuth();
  const { profile } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    setIsOpen(false);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Unable to sign out.', error);
    }
  }

  return (
    <header className="navbar">
      <Link className="navbar__brand" to="/dashboard">
        <svg className="navbar__mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13.2 1.8c.5 4-1.3 5.9-3.1 7.7-1.7 1.8-3.4 3.6-3.4 6.6a7.3 7.3 0 0 0 14.6 0c0-4-2.3-7.3-6.8-10.2.2 2.5-.7 3.8-1.8 4.7.3-4-.6-6.6-2.5-8.8-.4-.4-.8-.4-1 0Z" />
          <path d="M13.2 21a3.3 3.3 0 0 1-3.3-3.3c0-1.2.6-2.1 1.8-3.4.7-.8 1.5-1.7 2-2.9.9 1.6 1.2 2.9 1.2 4.4 1.1-.8 1.7-1.7 1.9-2.8.9 1.3 1.4 2.8 1.4 4.5a5 5 0 0 1-5 3.5Z" />
        </svg>
        <span className="navbar__brand-name">Streak Counter</span>
      </Link>
      <nav className="navbar__mobile-tabs" aria-label="Main navigation">
        <Link to="/dashboard" aria-label="Dashboard">
          <span aria-hidden="true">⌂</span>
          <span>Home</span>
        </Link>
        <Link to="/profile" aria-label="Profile">
          <span aria-hidden="true">◉</span>
          <span>Profile</span>
        </Link>
        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <Avatar name={profile.username || profile.name} size="small" />
          <span>Account</span>
        </button>
      </nav>
      <div className="navbar__user-menu" ref={menuRef}>
        <button
          className="navbar__user-trigger"
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          <Avatar name={profile.username || profile.name} size="small" />
          <span className="navbar__name">{profile.username || profile.name || 'Your profile'}</span>
          <span className={`navbar__chevron${isOpen ? ' is-open' : ''}`} aria-hidden="true">⌄</span>
        </button>
        {isOpen && (
          <div className="navbar__dropdown" role="menu">
            <Link to="/profile" role="menuitem" onClick={() => setIsOpen(false)}>Profile</Link>
            <button type="button" role="menuitem" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}
