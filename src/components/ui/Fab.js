import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';

// The orange "add" button that floats over a list. One look, one position, one press feel for the whole app.
export function Fab({ onPress, label, icon = 'add' }) {
  const { colors, spacing, shadows } = useTheme();
  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: 'rgba(255,255,255,0.3)', radius: 28 }}
      style={[
        {
          position: 'absolute',
          right: spacing.lg,
          bottom: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shadows.raised,
      ]}
    >
      <Ionicons name={icon} size={icon === 'add' ? 30 : 26} color="#fff" />
    </PressableScale>
  );
}
