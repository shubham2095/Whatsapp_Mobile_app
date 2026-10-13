import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, Screen, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { can, hasFeature, roleLabel } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

function Row({ icon, label, onPress, danger = false }) {
  const { colors, spacing } = useTheme();
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} />
      <Text style={{ flex: 1, color: tint }}>{label}</Text>
      {danger ? null : <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </Pressable>
  );
}

// Menu for everything that is not a tab. Feature entries are added here phase by phase.
export default function More() {
  const { user, logout } = useAuth();
  const { colors, spacing } = useTheme();
  const tenantUser = !user.is_super_admin;
  const showContacts = tenantUser && can(user, 'contacts.view');
  const showWhatsapp = tenantUser && can(user, 'whatsapp.view');
  const showTemplates = tenantUser && can(user, 'templates.view');
  const showBilling = tenantUser && can(user, 'billing.view');
  const showAnalytics = tenantUser && can(user, 'analytics.view') && hasFeature(user, 'reports');

  function confirmLogout() {
    Alert.alert('Sign out', 'Do you want to sign out of Heltog?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.md }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={user.name} size={52} />
          <View style={{ flex: 1 }}>
            <Text variant="subheading">{user.name}</Text>
            <Text variant="small" muted>{user.email}</Text>
            <Text variant="caption" color={colors.primary} style={{ fontWeight: '600', marginTop: 2 }}>
              {user.roles.map(roleLabel).join(', ')}
            </Text>
          </View>
        </Card>

        {showBilling ? (
          <Card style={{ paddingVertical: spacing.xs }}>
            <Row icon="card-outline" label="Billing and plan" onPress={() => router.push('/billing')} />
          </Card>
        ) : null}

        {showAnalytics ? (
          <Card style={{ paddingVertical: spacing.xs }}>
            <Row icon="stats-chart-outline" label="Analytics" onPress={() => router.push('/analytics')} />
          </Card>
        ) : null}

        {showWhatsapp || showTemplates ? (
          <Card style={{ paddingVertical: spacing.xs }}>
            {showWhatsapp ? <Row icon="logo-whatsapp" label="WhatsApp numbers" onPress={() => router.push('/whatsapp')} /> : null}
            {showTemplates ? <Row icon="document-text-outline" label="Templates" onPress={() => router.push('/templates')} /> : null}
          </Card>
        ) : null}

        {showContacts ? (
          <Card style={{ paddingVertical: spacing.xs }}>
            <Row icon="flame-outline" label="Hot list" onPress={() => router.push('/hot-list')} />
            <Row icon="ban-outline" label="Black list" onPress={() => router.push('/blacklist')} />
          </Card>
        ) : null}

        <Card style={{ paddingVertical: spacing.xs }}>
          <Row icon="person-outline" label="Profile" onPress={() => router.push('/profile')} />
          <Row icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
          <Row icon="lock-closed-outline" label="Change password" onPress={() => router.push('/change-password')} />
        </Card>

        <Card style={{ paddingVertical: spacing.xs }}>
          <Row icon="log-out-outline" label="Sign out" onPress={confirmLogout} danger />
        </Card>
      </View>
    </Screen>
  );
}
