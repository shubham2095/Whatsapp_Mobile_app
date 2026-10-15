import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

// Optional action: { label, onPress, icon } shows one clear next step under the message.
export function EmptyState({ icon = 'file-tray-outline', title, message, action }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.xs }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text variant="subheading" style={{ textAlign: 'center' }}>{title}</Text>
      {message ? <Text muted style={{ textAlign: 'center', maxWidth: 300 }}>{message}</Text> : null}
      {action ? <Button title={action.label} icon={action.icon} onPress={action.onPress} size="sm" style={{ marginTop: spacing.md }} /> : null}
    </View>
  );
}
