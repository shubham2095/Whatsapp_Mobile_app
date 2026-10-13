import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, Screen, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { roleLabel } from '@/lib/permissions';
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

        <Card style={{ paddingVertical: spacing.xs }}>
          <Row icon="person-outline" label="Profile" onPress={() => router.push('/profile')} />
          <Row icon="lock-closed-outline" label="Change password" onPress={() => router.push('/change-password')} />
        </Card>

        <Card style={{ paddingVertical: spacing.xs }}>
          <Row icon="log-out-outline" label="Sign out" onPress={confirmLogout} danger />
        </Card>
      </View>
    </Screen>
  );
}
