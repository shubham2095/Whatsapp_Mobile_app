import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const SIZES = { sm: { height: 40, px: 14, text: 'small' }, md: { height: 48, px: 20, text: 'body' }, lg: { height: 54, px: 24, text: 'body' } };

// variant: primary (orange CTA) | secondary (teal) | soft (tinted) | outline | danger | ghost
// size: sm | md | lg. icon: optional Ionicons name shown before the title.
export function Button({ title, onPress, variant = 'primary', size = 'md', icon, loading = false, disabled = false, style }) {
  const { colors, radius } = useTheme();
  const s = SIZES[size];
  const bg = { primary: colors.accent, secondary: colors.primary, soft: colors.chipBg, danger: colors.danger, outline: 'transparent', ghost: 'transparent' }[variant];
  const fg = variant === 'outline' || variant === 'ghost' || variant === 'soft' ? colors.primary : '#fff';
  const off = disabled || loading;
  const rippleColor = fg === '#fff' ? 'rgba(255,255,255,0.25)' : colors.primary + '22';
  return (
    <PressableScale
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      android_ripple={{ color: rippleColor }}
      style={[
        {
          backgroundColor: bg,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          borderWidth: 1.5,
          borderRadius: radius.md,
          paddingHorizontal: s.px,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: s.height,
          paddingVertical: 8,
          overflow: 'hidden',
          opacity: off ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 17 : 20} color={fg} /> : null}
          <Text variant={s.text} style={{ color: fg, fontWeight: '600' }}>{title}</Text>
        </View>
      )}
    </PressableScale>
  );
}
