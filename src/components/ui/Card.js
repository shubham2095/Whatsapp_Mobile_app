import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Card({ style, ...rest }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      {...rest}
      style={[{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }, style]}
    />
  );
}
