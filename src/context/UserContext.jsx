import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext.jsx';
import { auth, db, isFirebaseConfigured } from '../firebase.js';
import { checkStreaksOnLoad, normalizeHabit } from '../utils/streaks.js';
import { readStorage, writeStorage } from '../utils/storage.js';

const UserContext = createContext(null);
const EMPTY_PROFILE = { name: '', username: '', gender: '', habits: [], longestStreak: 0 };

export function UserProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (authLoading) return;
      if (!user) {
        setProfile(EMPTY_PROFILE);
        setLoadError('');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (isFirebaseConfigured && db) {
          const snapshot = await getDoc(doc(db, 'users', user.uid));
          if (active) {
            const storedProfile = snapshot.exists()
              ? { ...EMPTY_PROFILE, ...snapshot.data() }
              : EMPTY_PROFILE;
            const streakCheck = checkStreaksOnLoad(
              Array.isArray(storedProfile.habits) ? storedProfile.habits : [],
            );
            const loadedProfile = {
              ...storedProfile,
              habits: streakCheck.habits,
            };

            if (streakCheck.changed) {
              await setDoc(doc(db, 'users', user.uid), { habits: streakCheck.habits }, { merge: true });
            }
            if (active) setProfile(loadedProfile);
            setLoadError('');
          }
        } else {
          // Local / Offline mode
          const profiles = readStorage('streak_local_profiles', {});
          const storedProfile = profiles[user.uid] || EMPTY_PROFILE;
          const streakCheck = checkStreaksOnLoad(
            Array.isArray(storedProfile.habits) ? storedProfile.habits : [],
          );
          const loadedProfile = {
            ...storedProfile,
            habits: streakCheck.habits,
          };

          if (streakCheck.changed) {
            profiles[user.uid] = loadedProfile;
            writeStorage('streak_local_profiles', profiles);
          }
          if (active) {
            setProfile(loadedProfile);
            setLoadError('');
          }
        }
      } catch (error) {
        console.error('Unable to load the user profile.', error);
        if (active) {
          setProfile(EMPTY_PROFILE);
          setLoadError('We couldn’t load your profile. Please refresh and try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  async function updateProfile(updates) {
    const activeUser = user ?? auth?.currentUser ?? readStorage('streak_local_current_user', null);
    if (!activeUser) {
      throw new Error('You must be signed in to save your profile.');
    }

    const nextProfile = { ...profile, ...updates };
    if (Array.isArray(updates.habits)) {
      nextProfile.habits = updates.habits.map((habit, index) => normalizeHabit(habit, index));
    }

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'users', activeUser.uid), nextProfile, { merge: true });
    } else {
      const profiles = readStorage('streak_local_profiles', {});
      profiles[activeUser.uid] = nextProfile;
      writeStorage('streak_local_profiles', profiles);
    }

    setProfile(nextProfile);
  }

  const value = useMemo(
    () => ({ profile, updateProfile, loading, loadError }),
    [profile, loading, loadError],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside a UserProvider');
  }
  return context;
}
