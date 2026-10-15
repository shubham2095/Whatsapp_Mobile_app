import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';

function Action({ icon, label, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 88, backgroundColor: color, alignItems: 'center', justifyContent: 'center', gap: 4 }}
    >
      <Ionicons name={icon} size={22} color="#fff" />
      <Text variant="caption" style={{ color: '#fff', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

// Swipe right to pin or unpin a chat, swipe left to mark it read. The actions are buttons, so nothing happens by
// accident from a half swipe; tapping one does it and closes the row.
export function SwipeableConversation({ pinned, unread, onTogglePin, onMarkRead, children }) {
  const { colors } = useTheme();
  const ref = useRef(null);

  const run = (fn) => () => {
    haptics.select();
    ref.current?.close();
    fn();
  };

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={40}
      rightThreshold={40}
      renderLeftActions={() => (
        <View style={{ flexDirection: 'row' }}>
          <Action icon={pinned ? 'pin-outline' : 'pin'} label={pinned ? 'Unpin' : 'Pin'} color={colors.accent} onPress={run(onTogglePin)} />
        </View>
      )}
      renderRightActions={unread ? () => (
        <View style={{ flexDirection: 'row' }}>
          <Action icon="checkmark-done" label="Mark read" color={colors.primary} onPress={run(onMarkRead)} />
        </View>
      ) : undefined}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
