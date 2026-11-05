import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';

export default function ProfileCompletionRoute({ children }) {
  const { profile, loading, loadError } = useUser();
  const profileIsComplete = Boolean(profile.username && profile.gender);

  if (loading) {
    return <div className="auth-loading" role="status">Loading your profile…</div>;
  }

  if (loadError) {
    return <p className="auth-loading" role="alert">{loadError}</p>;
  }

  if (!profileIsComplete) {
    return <Navigate to="/setup" replace />;
  }

  return children;
}
