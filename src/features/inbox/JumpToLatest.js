import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';

// A small round "go to the newest message" button that fades in once you have scrolled up in a chat.
// `count` is how many new customer messages came in while you were scrolled up.
export function JumpToLatest({ onPress, count = 0 }) {
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
        accessibilityLabel={count > 0 ? `Jump to the newest message, ${count} new` : 'Jump to the newest message'}
        style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-down" size={22} color={colors.primary} />
      </Pressable>
      {count > 0 ? (
        <View style={{ position: 'absolute', top: -6, right: -4, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
