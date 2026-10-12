import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export function EmptyState({ icon = 'file-tray-outline', title, message }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Ionicons name={icon} size={48} color={colors.muted} />
      <Text variant="subheading" style={{ marginTop: spacing.md }}>{title}</Text>
      {message ? <Text muted style={{ marginTop: spacing.xs, textAlign: 'center' }}>{message}</Text> : null}
    </View>
  );
}
