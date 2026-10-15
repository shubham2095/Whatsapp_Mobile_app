import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

// Light mode: white card with a soft shadow. Dark mode: a lighter surface with a hairline border.
export function Card({ style, ...rest }) {
  const { colors, radius, spacing, shadows } = useTheme();
  return (
    <View
      {...rest}
      style={[{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }, shadows.card, style]}
    />
  );
}
