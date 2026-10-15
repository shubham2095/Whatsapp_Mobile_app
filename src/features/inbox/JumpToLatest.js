import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';

// A small round "go to the newest message" button that fades in once you have scrolled up in a chat.
export function JumpToLatest({ onPress }) {
  const { colors, spacing, shadows } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(140)}
      style={[{ position: 'absolute', right: spacing.lg, bottom: spacing.md }, shadows.raised]}
    >
      <Pressable
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel="Jump to the newest message"
        style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-down" size={22} color={colors.primary} />
      </Pressable>
    </Animated.View>
  );
}
