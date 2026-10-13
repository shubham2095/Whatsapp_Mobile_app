import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import { setUnauthorizedHandler } from '@/api/client';
import { clearBillingDetails } from '@/features/billing/billingDetails';
import { unregisterFromPush } from '@/features/push/notifications';
import { clearToken, getToken, saveToken } from '@/lib/storage';

const AuthContext = createContext(null);

// Re-issue the JWT at most this often while the app is in use.
const REFRESH_EVERY_MS = 30 * 60 * 1000;

// status: 'loading' (checking stored token) | 'authed' | 'guest' | 'offline' (server unreachable)
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ status: 'loading', user: null });
  const lastRefreshAt = useRef(0);

  const endSession = useCallback(async () => {
    await clearToken();
    await clearBillingDetails(); // invoice name/address belong to the signed-out user
    queryClient.clear();
    setState({ status: 'guest', user: null });
  }, [queryClient]);

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
      setState({ status: 'guest', user: null });
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
      setState({ status: 'authed', user });
    } catch (e) {
      if (e.status === 401) return; // handler ended the session
      setState((s) => ({ ...s, status: 'offline' }));
    }
  }, [rotateToken]);

  // Initial status is already 'loading'; bootstrap only sets state after awaiting storage / network.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    bootstrap();
  }, [bootstrap]);

  // Keep the session alive when the app returns to the foreground.
  useEffect(() => {
    if (state.status !== 'authed') return undefined;
    const sub = AppState.addEventListener('change', async (next) => {
      if (next !== 'active' || Date.now() - lastRefreshAt.current < REFRESH_EVERY_MS) return;
      try {
        await rotateToken();
        const { user } = await authApi.me();
        setState({ status: 'authed', user });
      } catch {}
    });
    return () => sub.remove();
  }, [state.status, rotateToken]);

  const startSession = useCallback(async (payload) => {
    await saveToken(payload.token);
    lastRefreshAt.current = Date.now();
    setState({ status: 'authed', user: payload.user });
  }, []);

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      retry: () => {
        setState((s) => ({ ...s, status: 'loading' }));
        return bootstrap();
      },
      login: async (email, password) => startSession(await authApi.login(email.trim(), password)),
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
        setState({ status: 'authed', user });
        return user;
      },
      setUser: (user) => setState((s) => ({ ...s, user })),
    }),
    [state, bootstrap, startSession, endSession],
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
