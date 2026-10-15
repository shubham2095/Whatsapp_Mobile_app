import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { formatTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

// An internal note in the chat timeline. Only the team sees it; it is never sent to the customer.
export const NoteBubble = memo(function NoteBubble({ note, onLongPress }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      onLongPress={() => onLongPress?.(note)}
      delayLongPress={350}
      accessibilityRole="text"
      accessibilityLabel={`Internal note from ${note.author?.name ?? 'a teammate'}`}
      style={{
        marginHorizontal: spacing.lg,
        marginVertical: spacing.xs,
        padding: spacing.md,
        gap: 2,
        borderRadius: radius.md,
        backgroundColor: colors.warning + '22',
        borderWidth: 1,
        borderColor: colors.warning + '66',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="lock-closed" size={12} color={colors.warning} />
        <Text variant="caption" style={{ color: colors.warning, fontWeight: '700' }}>
          Internal note{note.author?.name ? ` - ${note.author.name}` : ''}
        </Text>
        <View style={{ flex: 1 }} />
        <Text variant="caption" muted>{formatTime(note.created_at)}</Text>
      </View>
      <Text>{note.body}</Text>
      <Text variant="caption" muted>Only your team can see this.</Text>
    </Pressable>
  );
});
