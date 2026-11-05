import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Card from '../components/Card.jsx';
import Navbar from '../components/Navbar.jsx';
import './Profile.css';

const genderLabels = {
  male: 'Male',
  female: 'Female',
  'prefer-not-to-say': 'Prefer not to say',
};

export default function Profile() {
  const { user } = useAuth();
  const { profile } = useUser();
  const username = profile.username || profile.name || 'Streak Counter user';

  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-page__main">
        <Link className="profile-page__back" to="/dashboard">← Back to dashboard</Link>
        <Card className="profile-card">
          <Avatar name={username} size="large" />
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>{username}</h1>
          <dl className="profile-card__details">
            <div>
              <dt>Username</dt>
              <dd>@{profile.username || '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email || '—'}</dd>
            </div>
            <div>
              <dt>Gender</dt>
              <dd>{genderLabels[profile.gender] || '—'}</dd>
            </div>
          </dl>
        </Card>
      </main>
    </div>
  );
}
