import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase.js';
import { getUsernameFormatError, normalizeUsername } from '../utils/usernames.js';
import { readStorage } from '../utils/storage.js';

export default function useUsernameAvailability(username, enabled = true) {
  const [result, setResult] = useState({ status: 'idle', message: '' });
  const normalizedUsername = normalizeUsername(username);

  useEffect(() => {
    if (!enabled || getUsernameFormatError(username)) {
      setResult({ status: 'idle', message: '' });
      return undefined;
    }

    let active = true;
    setResult({ status: 'checking', message: 'Checking username…' });

    const timer = window.setTimeout(async () => {
      try {
        if (isFirebaseConfigured && db) {
          const usernameSnapshot = await getDoc(doc(db, 'usernames', normalizedUsername));
          if (!active) return;

          const currentUid = auth?.currentUser?.uid;
          const isCurrentUser = usernameSnapshot.exists() && usernameSnapshot.data().uid === currentUid;
          setResult(
            usernameSnapshot.exists() && !isCurrentUser
              ? { status: 'taken', message: 'That username is already taken.' }
              : { status: 'available', message: 'Username is available.' },
          );
        } else {
          // Local / Offline mode
          const usernames = readStorage('streak_local_usernames', {});
          if (!active) return;

          const currentUser = auth?.currentUser || readStorage('streak_local_current_user', null);
          const currentUid = currentUser?.uid;
          const existing = usernames[normalizedUsername];
          const isCurrentUser = existing && existing.uid === currentUid;

          setResult(
            existing && !isCurrentUser
              ? { status: 'taken', message: 'That username is already taken.' }
              : { status: 'available', message: 'Username is available.' },
          );
        }
      } catch (error) {
        console.error('Unable to check username availability.', error);
        if (active) {
          setResult({ status: 'error', message: 'We couldn’t check that username. Try again.' });
        }
      }
    }, 400);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [enabled, normalizedUsername, username]);

  return result;
}
