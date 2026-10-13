import { Stack } from 'expo-router';
import { NoPlanScreen } from '@/features/auth/NoPlanScreen';
import { useUser } from '@/features/auth/AuthProvider';
import { hasActivePlan, isPlanExpired } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

export default function AppLayout() {
  const user = useUser();
  const { colors } = useTheme();

  // During sign-out the session clears one render before the navigator drops this group.
  if (!user) return null;

  // No plan at all: nothing else is reachable (same as the web app). Expired plans
  // still get in, with a renew banner on the tabs.
  if (!hasActivePlan(user) && !isPlanExpired(user)) return <NoPlanScreen />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryDark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change password' }} />
    </Stack>
  );
}
