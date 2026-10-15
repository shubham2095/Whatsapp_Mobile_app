import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

// The orange "add" button that floats over a list. One look, one position, one press feel for the whole app.
export function Fab({ onPress, label, icon = 'add' }) {
  const { colors, spacing, shadows } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: 'rgba(255,255,255,0.3)', radius: 28 }}
      style={({ pressed }) => ({
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.94 : 1 }],
        ...shadows.raised,
      })}
    >
      <Ionicons name={icon} size={icon === 'add' ? 30 : 26} color="#fff" />
    </Pressable>
  );
}
