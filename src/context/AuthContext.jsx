import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAdditionalUserInfo,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../firebase.js';
import { normalizeUsername } from '../utils/usernames.js';
import { readStorage, writeStorage } from '../utils/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (isFirebaseConfigured) return null;
    return readStorage('streak_local_current_user', null);
  });
  const [loading, setLoading] = useState(isFirebaseConfigured && Boolean(auth));

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (error) => {
        console.error('Unable to restore the Firebase authentication session.', error);
        setUser(null);
        setLoading(false);
      },
    );
  }, []);

  // Google sign-in starts onboarding; an existing profile skips straight to the app.
  async function signInWithGoogle() {
    if (isFirebaseConfigured && auth && db) {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      const profileSnapshot = await getDoc(doc(db, 'users', result.user.uid));
      return {
        user: result.user,
        isNewUser: getAdditionalUserInfo(result)?.isNewUser ?? false,
        hasProfile: profileSnapshot.exists(),
        profile: profileSnapshot.exists() ? profileSnapshot.data() : null,
      };
    }

    // Local / Offline mode fallback
    const localGoogleUser = {
      uid: 'local-google-user',
      email: 'demo@streakcounter.app',
      displayName: 'Demo User',
      providerData: [{ providerId: 'google.com' }],
    };
    writeStorage('streak_local_current_user', localGoogleUser);
    setUser(localGoogleUser);
    const profiles = readStorage('streak_local_profiles', {});
    const existingProfile = profiles[localGoogleUser.uid] || null;
    const hasProfile = Boolean(existingProfile?.username && existingProfile?.gender);
    return {
      user: localGoogleUser,
      isNewUser: !hasProfile,
      hasProfile,
      profile: existingProfile,
    };
  }

  // Link the password provider to the Google identity, then reserve the username.
  async function createGoogleProfile({ username, password, gender }) {
    const currentUser = user ?? auth?.currentUser ?? readStorage('streak_local_current_user', null);
    if (!currentUser || !currentUser.email) {
      throw new Error('Sign in before creating your profile.');
    }

    const normalizedUsername = normalizeUsername(username);

    if (isFirebaseConfigured && auth && db && auth.currentUser) {
      const firebaseCurrentUser = auth.currentUser;
      const hasPasswordProvider = firebaseCurrentUser.providerData.some(
        (provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID,
      );
      const credential = EmailAuthProvider.credential(firebaseCurrentUser.email, password);

      if (hasPasswordProvider) {
        await updatePassword(firebaseCurrentUser, password);
      } else {
        await linkWithCredential(firebaseCurrentUser, credential);
      }

      await runTransaction(db, async (transaction) => {
        const usernameRef = doc(db, 'usernames', normalizedUsername);
        const profileRef = doc(db, 'users', firebaseCurrentUser.uid);
        const usernameSnapshot = await transaction.get(usernameRef);

        if (usernameSnapshot.exists() && usernameSnapshot.data().uid !== firebaseCurrentUser.uid) {
          const error = new Error('That username is already taken.');
          error.code = 'auth/username-already-taken';
          throw error;
        }

        transaction.set(usernameRef, {
          uid: firebaseCurrentUser.uid,
          email: firebaseCurrentUser.email,
          username,
        });
        transaction.set(
          profileRef,
          {
            username,
            name: username,
            gender,
            email: firebaseCurrentUser.email,
          },
          { merge: true },
        );
      });

      return firebaseCurrentUser;
    }

    // Local / Offline mode
    const usernames = readStorage('streak_local_usernames', {});
    if (usernames[normalizedUsername] && usernames[normalizedUsername].uid !== currentUser.uid) {
      const error = new Error('That username is already taken.');
      error.code = 'auth/username-already-taken';
      throw error;
    }

    usernames[normalizedUsername] = {
      uid: currentUser.uid,
      email: currentUser.email,
      username,
    };
    writeStorage('streak_local_usernames', usernames);

    const credentials = readStorage('streak_local_credentials', {});
    credentials[currentUser.uid] = {
      email: currentUser.email,
      password,
      username,
    };
    writeStorage('streak_local_credentials', credentials);

    const profiles = readStorage('streak_local_profiles', {});
    profiles[currentUser.uid] = {
      ...(profiles[currentUser.uid] || {}),
      username,
      name: username,
      gender,
      email: currentUser.email,
    };
    writeStorage('streak_local_profiles', profiles);

    const updatedUser = {
      ...currentUser,
      displayName: username,
    };
    writeStorage('streak_local_current_user', updatedUser);
    setUser(updatedUser);
    return updatedUser;
  }

  // Direct signup with Email and Password
  async function signUpWithEmail({ email, username, password, gender }) {
    const normalizedUsername = normalizeUsername(username);

    if (isFirebaseConfigured && auth && db) {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = result.user;
      setUser(newUser);

      await runTransaction(db, async (transaction) => {
        const usernameRef = doc(db, 'usernames', normalizedUsername);
        const profileRef = doc(db, 'users', newUser.uid);
        const usernameSnapshot = await transaction.get(usernameRef);

        if (usernameSnapshot.exists() && usernameSnapshot.data().uid !== newUser.uid) {
          const error = new Error('That username is already taken.');
          error.code = 'auth/username-already-taken';
          throw error;
        }

        transaction.set(usernameRef, {
          uid: newUser.uid,
          email,
          username,
        });
        transaction.set(
          profileRef,
          {
            username,
            name: username,
            gender,
            email,
          },
          { merge: true },
        );
      });

      return newUser;
    }

    // Local / Offline mode
    const uid = 'local-user-' + Date.now();
    const usernames = readStorage('streak_local_usernames', {});
    if (usernames[normalizedUsername]) {
      const error = new Error('That username is already taken.');
      error.code = 'auth/username-already-taken';
      throw error;
    }

    usernames[normalizedUsername] = {
      uid,
      email,
      username,
    };
    writeStorage('streak_local_usernames', usernames);

    const credentials = readStorage('streak_local_credentials', {});
    credentials[uid] = {
      email,
      password,
      username,
    };
    writeStorage('streak_local_credentials', credentials);

    const profiles = readStorage('streak_local_profiles', {});
    profiles[uid] = {
      username,
      name: username,
      gender,
      email,
      habits: [],
      longestStreak: 0,
    };
    writeStorage('streak_local_profiles', profiles);

    const localUser = {
      uid,
      email,
      displayName: username,
      providerData: [{ providerId: 'password' }],
    };
    writeStorage('streak_local_current_user', localUser);
    setUser(localUser);
    return localUser;
  }

  // Username index documents resolve the email needed by email/password auth.
  async function signInWithUsername(username, password) {
    const normalizedUsername = normalizeUsername(username);

    if (isFirebaseConfigured && auth && db) {
      const usernameSnapshot = await getDoc(doc(db, 'usernames', normalizedUsername));
      if (!usernameSnapshot.exists()) {
        throw new Error('Incorrect username or password.');
      }
      const { email } = usernameSnapshot.data();
      if (typeof email !== 'string' || !email) {
        throw new Error('Incorrect username or password.');
      }
      return signInWithEmailAndPassword(auth, email, password);
    }

    // Local / Offline mode
    const usernames = readStorage('streak_local_usernames', {});
    const userEntry = usernames[normalizedUsername];
    if (!userEntry) {
      throw new Error('Incorrect username or password.');
    }

    const credentials = readStorage('streak_local_credentials', {});
    const creds = credentials[userEntry.uid];
    if (!creds || creds.password !== password) {
      throw new Error('Incorrect username or password.');
    }

    const localUser = {
      uid: userEntry.uid,
      email: userEntry.email,
      displayName: userEntry.username,
      providerData: [{ providerId: 'password' }],
    };
    writeStorage('streak_local_current_user', localUser);
    setUser(localUser);
    return { user: localUser };
  }

  async function resetPasswordForUsername(username) {
    const normalizedUsername = normalizeUsername(username);

    if (isFirebaseConfigured && auth && db) {
      const usernameSnapshot = await getDoc(doc(db, 'usernames', normalizedUsername));
      if (!usernameSnapshot.exists() || typeof usernameSnapshot.data().email !== 'string') {
        throw new Error('Enter your username to request a password reset.');
      }
      await sendPasswordResetEmail(auth, usernameSnapshot.data().email);
      return;
    }

    // Local / Offline mode
    const usernames = readStorage('streak_local_usernames', {});
    if (!usernames[normalizedUsername]) {
      throw new Error('Enter your username to request a password reset.');
    }
  }

  async function logout() {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
      setUser(null);
      return;
    }

    // Local / Offline mode
    writeStorage('streak_local_current_user', null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isLocalMode: !isFirebaseConfigured,
      signInWithGoogle,
      createGoogleProfile,
      signUpWithEmail,
      signInWithUsername,
      resetPasswordForUsername,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
