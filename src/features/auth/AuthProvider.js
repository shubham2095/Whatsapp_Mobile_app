import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { onlineManager } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import { setUnauthorizedHandler } from '@/api/client';
import { clearBillingDetails } from '@/features/billing/billingDetails';
import { unregisterFromPush } from '@/features/push/notifications';
import { setMonitoringUser } from '@/lib/monitoring';
import { clearPersistedCache } from '@/lib/queryClient';
import { clearToken, getToken, saveToken } from '@/lib/storage';
import { clearCachedUser, loadCachedUser, saveCachedUser } from '@/lib/userCache';

const AuthContext = createContext(null);

// Re-issue the JWT at most this often while the app is in use.
const REFRESH_EVERY_MS = 30 * 60 * 1000;

// status: 'loading' (checking stored token) | 'authed' | 'guest' | 'offline' (server unreachable, nothing saved)
// `stale` is true when the user was restored from the phone because the server could not be reached.
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, stale: false });
  const lastRefreshAt = useRef(0);

  const setAuthed = useCallback((user, stale = false) => {
    setState({ status: 'authed', user, stale });
    saveCachedUser(user);
    setMonitoringUser(user.id);
  }, []);

  const endSession = useCallback(async () => {
    await clearToken();
    await clearBillingDetails(); // invoice name/address belong to the signed-out user
    await clearCachedUser();
    await clearPersistedCache(); // saved chats and contacts belong to the signed-out user too
    setMonitoringUser(null);
    setState({ status: 'guest', user: null, stale: false });
  }, []);

  // Any 401 from an authenticated call drops the user back to login.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  const rotateToken = useCallback(async () => {
    const data = await authApi.refresh();
    await saveToken(data.token);
    lastRefreshAt.current = Date.now();
  }, []);

  const bootstrap = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setState({ status: 'guest', user: null, stale: false });
      return;
    }
    try {
      try {
        await rotateToken();
      } catch (e) {
        // 401 already signed us out via the handler; other failures fall through to /me.
        if (e.status === 401) return;
      }
      const { user } = await authApi.me();
      setAuthed(user);
    } catch (e) {
      if (e.status === 401) return; // handler ended the session
      // No signal (or the server is down): open with the last saved user so saved chats stay readable.
      const saved = await loadCachedUser();
      if (saved) setAuthed(saved, true);
      else setState((s) => ({ ...s, status: 'offline' }));
    }
  }, [rotateToken, setAuthed]);

  // Initial status is already 'loading'; bootstrap only sets state after awaiting storage / network.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    bootstrap();
  }, [bootstrap]);

  // Opened from saved data: check the session again as soon as the internet is back.
  useEffect(() => {
    if (!state.stale) return undefined;
    return onlineManager.subscribe((online) => {
      if (!online) return;
      rotateToken()
        .catch(() => {})
        .then(() => authApi.me())
        .then(({ user }) => setAuthed(user))
        .catch(() => {});
    });
  }, [state.stale, rotateToken, setAuthed]);

  // Keep the session alive when the app returns to the foreground.
  useEffect(() => {
    if (state.status !== 'authed') return undefined;
    const sub = AppState.addEventListener('change', async (next) => {
      if (next !== 'active' || Date.now() - lastRefreshAt.current < REFRESH_EVERY_MS) return;
      try {
        await rotateToken();
        const { user } = await authApi.me();
        setAuthed(user);
      } catch {}
    });
    return () => sub.remove();
  }, [state.status, rotateToken, setAuthed]);

  const startSession = useCallback(
    async (payload) => {
      await saveToken(payload.token);
      lastRefreshAt.current = Date.now();
      setAuthed(payload.user);
    },
    [setAuthed],
  );

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      stale: state.stale,
      retry: () => {
        setState((s) => ({ ...s, status: 'loading' }));
        return bootstrap();
      },
      login: async (email, password) => startSession(await authApi.login(email.trim(), password)),
      loginWithOtp: async (phone, code) => startSession(await authApi.verifyOtp(phone, code)),
      register: async (body) => startSession(await authApi.register(body)),
      logout: async () => {
        // Stop pushes to this phone while the session token is still valid.
        await unregisterFromPush();
        try {
          await authApi.logout();
        } catch {}
        await endSession();
      },
      // Re-read the user (roles, permissions, plan) from the server.
      reloadUser: async () => {
        const { user } = await authApi.me();
        setAuthed(user);
        return user;
      },
      setUser: (user) => {
        setState((s) => ({ ...s, user }));
        saveCachedUser(user);
      },
    }),
    [state, bootstrap, startSession, endSession, setAuthed],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// For screens inside the authenticated area, where `user` is always set.
export function useUser() {
  return useAuth().user;
}
