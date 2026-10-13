import { Stack } from 'expo-router';
import { NoPlanScreen } from '@/features/auth/NoPlanScreen';
import { useUser } from '@/features/auth/AuthProvider';
import { usePushNotifications } from '@/features/push/usePushNotifications';
import { can, hasActivePlan, isPlanExpired } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

// Registers for push and routes notification taps. Renders nothing.
function PushBridge({ user }) {
  usePushNotifications({ canViewInbox: !user.is_super_admin && can(user, 'conversations.view') });
  return null;
}

export default function AppLayout() {
  const user = useUser();
  const { colors } = useTheme();

  // During sign-out the session clears one render before the navigator drops this group.
  if (!user) return null;

  // No plan at all: nothing else is reachable (same as the web app). Expired plans
  // still get in, with a renew banner on the tabs.
  if (!hasActivePlan(user) && !isPlanExpired(user)) return <NoPlanScreen />;

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primaryDark },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
        <Stack.Screen name="contact/[id]" options={{ title: 'Contact' }} />
        <Stack.Screen name="contact-form" options={{ title: 'Contact' }} />
        <Stack.Screen name="import-contacts" options={{ title: 'Import contacts' }} />
        <Stack.Screen name="hot-list" options={{ title: 'Hot list' }} />
        <Stack.Screen name="blacklist" options={{ title: 'Black list' }} />
        <Stack.Screen name="whatsapp" options={{ title: 'WhatsApp numbers' }} />
        <Stack.Screen name="whatsapp-connect" options={{ title: 'Connect a number' }} />
        <Stack.Screen name="templates" options={{ title: 'Templates' }} />
        <Stack.Screen name="template/[id]" options={{ title: 'Template' }} />
        <Stack.Screen name="template-form" options={{ title: 'Create template' }} />
        <Stack.Screen name="campaign/[id]" options={{ title: 'Campaign' }} />
        <Stack.Screen name="campaign-form" options={{ title: 'New campaign' }} />
        <Stack.Screen name="bulk/[id]" options={{ title: 'Bulk send' }} />
        <Stack.Screen name="bulk-form" options={{ title: 'New bulk send' }} />
        <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="change-password" options={{ title: 'Change password' }} />
      </Stack>
      <PushBridge user={user} />
    </>
  );
}
