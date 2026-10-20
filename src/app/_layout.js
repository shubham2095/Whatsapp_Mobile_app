import { useEffect } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Network from 'expo-network';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { UpdateBanner } from '@/components/UpdateBanner';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { OfflineScreen } from '@/features/auth/OfflineScreen';
import { captureError, monitoringEnabled, withMonitoring } from '@/lib/monitoring';
import { persistOptions, queryClient } from '@/lib/queryClient';
import { fontFiles } from '@/theme/fonts';
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
      <UpdateBanner />
      {authed ? <Onboarding /> : null}
    </>
  );
}

// Shown when a screen crashes while rendering. It sits outside the theme providers, so it uses plain colours.
export function ErrorBoundary({ error, retry }) {
  useEffect(() => {
    captureError(error);
  }, [error]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f0f2f5' }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#111b21', marginBottom: 8 }}>Something went wrong</Text>
      <Text style={{ color: '#667781', textAlign: 'center', marginBottom: 24 }}>{monitoringEnabled ? 'The problem was reported. ' : ''}Try again, and if it keeps happening please contact support.</Text>
      <Pressable onPress={retry} accessibilityRole="button" style={{ backgroundColor: '#f26f21', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

function RootLayout() {
  // The splash screen stays up until the fonts are ready (they are bundled, so this is quick). If loading
  // ever fails the app still opens, just with the phone's own font.
  const [fontsLoaded, fontError] = useFonts(fontFiles);

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

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}

export default withMonitoring(RootLayout);
