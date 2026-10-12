import { ActivityIndicator, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// variant: primary (orange CTA) | secondary (teal) | outline | danger | ghost
export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const { colors, radius, spacing } = useTheme();
  const bg = { primary: colors.accent, secondary: colors.primary, danger: colors.danger, outline: 'transparent', ghost: 'transparent' }[variant];
  const fg = variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff';
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          borderWidth: 1.5,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          opacity: off ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '600' }}>{title}</Text>}
    </Pressable>
  );
}
