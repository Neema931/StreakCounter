import { Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import Welcome from './pages/Welcome.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ProfileCompletionRoute from './components/ProfileCompletionRoute.jsx';
import Profile from './pages/Profile.jsx';
import HabitPage from './pages/HabitPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth?mode=signup" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <ProfileCompletionRoute>
              <Welcome />
            </ProfileCompletionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProfileCompletionRoute>
              <Dashboard />
            </ProfileCompletionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileCompletionRoute>
              <Profile />
            </ProfileCompletionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/habit/:habitId"
        element={
          <ProtectedRoute>
            <ProfileCompletionRoute>
              <HabitPage />
            </ProfileCompletionRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
