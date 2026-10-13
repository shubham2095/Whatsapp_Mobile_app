import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// tone: danger | success | warning | info
export function Banner({ message, tone = 'danger', style }) {
  const { colors, radius, spacing } = useTheme();
  if (!message) return null;
  const fg = { danger: colors.danger, success: colors.success, warning: colors.warning, info: colors.primary }[tone];
  const icon = { danger: 'alert-circle', success: 'checkmark-circle', warning: 'warning', info: 'information-circle' }[tone];
  return (
    <View
      accessibilityRole="alert"
      style={[
        { flexDirection: 'row', gap: spacing.sm, backgroundColor: fg + '1a', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
        style,
      ]}
    >
      <Ionicons name={icon} size={20} color={fg} />
      <Text variant="small" style={{ flex: 1, color: fg }}>{message}</Text>
    </View>
  );
}
