import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// tone: neutral | success | warning | danger | accent
export function Badge({ label, tone = 'neutral' }) {
  const { colors, radius, spacing } = useTheme();
  const fg = { neutral: colors.primary, success: colors.success, warning: colors.warning, danger: colors.danger, accent: colors.accent }[tone];
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: fg + '22', borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 }}>
      <Text variant="caption" style={{ color: fg, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
