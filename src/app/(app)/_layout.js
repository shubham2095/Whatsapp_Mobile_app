import { Stack } from 'expo-router';
import { useUser } from '@/features/auth/AuthProvider';
import { usePushNotifications } from '@/features/push/usePushNotifications';
import { can, hasActivePlan } from '@/lib/permissions';
import { headerTitleFont } from '@/theme/fonts';
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

  // No active plan (none bought, or expired): the backend refuses every workspace call, so only
  // billing, profile and notifications are reachable. Buying a plan flips this and the router
  // moves to the tabs on its own.
  const planBlocked = !hasActivePlan(user);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primaryDark },
          headerTintColor: '#fff',
          headerTitleStyle: headerTitleFont,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={!planBlocked}>
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
          <Stack.Screen name="team" options={{ title: 'Team' }} />
          <Stack.Screen name="team-form" options={{ title: 'Team member' }} />
          <Stack.Screen name="agents" options={{ title: 'Agents' }} />
          <Stack.Screen name="agent/[id]" options={{ title: 'Agent' }} />
          <Stack.Screen name="chatbots" options={{ title: 'Chatbots' }} />
          <Stack.Screen name="chatbot/[id]" options={{ title: 'Chatbot' }} />
          <Stack.Screen name="chatbot-form" options={{ title: 'Chatbot' }} />
          <Stack.Screen name="automations" options={{ title: 'Automations' }} />
          <Stack.Screen name="automation/[id]" options={{ title: 'Automation' }} />
          <Stack.Screen name="social" options={{ title: 'Social' }} />
          <Stack.Screen name="social-post-form" options={{ title: 'New post' }} />
          <Stack.Screen name="assistant" options={{ title: 'Ask AI' }} />
          <Stack.Screen name="quick-replies" options={{ title: 'Quick replies' }} />
        </Stack.Protected>

        <Stack.Protected guard={planBlocked}>
          <Stack.Screen name="no-plan" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Screen name="company/[id]" options={{ title: 'Company' }} />
        <Stack.Screen name="company-form" options={{ title: 'Add company' }} />
        <Stack.Screen name="plan-form" options={{ title: 'Plan' }} />
        <Stack.Screen name="admin-settings" options={{ title: 'Platform settings' }} />
        <Stack.Screen name="billing" options={{ title: 'Billing' }} />
        <Stack.Screen name="plans" options={{ title: 'Plans' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="wallet" options={{ title: 'Wallet' }} />
        <Stack.Screen name="invoices" options={{ title: 'Invoices' }} />
        <Stack.Screen name="invoice/[id]" options={{ title: 'Invoice' }} />
        <Stack.Screen name="support" options={{ title: 'Support' }} />
        <Stack.Screen name="support-form" options={{ title: 'New ticket' }} />
        <Stack.Screen name="ticket/[id]" options={{ title: 'Ticket' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="delete-account" options={{ title: 'Delete account' }} />
        <Stack.Screen name="change-password" options={{ title: 'Change password' }} />
      </Stack>
      <PushBridge user={user} />
    </>
  );
}
