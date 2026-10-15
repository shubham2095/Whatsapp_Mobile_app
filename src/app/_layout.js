import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import * as Network from 'expo-network';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { OfflineScreen } from '@/features/auth/OfflineScreen';
import { persistOptions, queryClient } from '@/lib/queryClient';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

const isReachable = (state) => !!state.isConnected && state.isInternetReachable !== false;

function Navigator() {
  const { status } = useAuth();
  const { isDark, colors } = useTheme();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null; // splash screen stays up
  if (status === 'offline') return <OfflineScreen />;

  const authed = status === 'authed';
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={authed}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!authed}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <OfflineIndicator />
    </>
  );
}

export default function RootLayout() {
  // Tell React Query when the app is foregrounded: pauses polling in the background and
  // refetches on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
    return () => sub.remove();
  }, []);

  // Tell React Query when the phone loses or regains internet: it then stops retrying while offline
  // and refetches every active screen the moment the connection is back.
  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      Network.getNetworkStateAsync().then((state) => setOnline(isReachable(state))).catch(() => {});
      const sub = Network.addNetworkStateListener((state) => setOnline(isReachable(state)));
      return () => sub.remove();
    });
  }, []);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Navigator />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
