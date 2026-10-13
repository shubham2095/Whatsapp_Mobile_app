import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Text } from '@/components/ui';
import { formatListTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

export function contactLabel(conversation) {
  const c = conversation.contact;
  return c?.name || c?.phone || c?.wa_id || 'Unknown';
}

export const ConversationRow = memo(function ConversationRow({ conversation, onPress }) {
  const { colors, spacing } = useTheme();
  const unread = conversation.unread_count > 0;
  const name = contactLabel(conversation);

  return (
    <Pressable
      onPress={() => onPress(conversation)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: pressed ? colors.chipBg : colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      })}
    >
      <Avatar name={name} size={48} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, fontWeight: unread ? '700' : '600' }}>{name}</Text>
          {conversation.contact?.is_hot ? <Ionicons name="flame" size={15} color={colors.accent} /> : null}
          <View style={{ flex: 1 }} />
          <Text variant="caption" color={unread ? colors.primary : colors.muted}>{formatListTime(conversation.last_message_at)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 }}>
          <Text
            numberOfLines={1}
            variant="small"
            muted={!unread}
            style={{ flex: 1, fontWeight: unread ? '600' : '400' }}
          >
            {conversation.last_message_preview || 'No messages yet'}
          </Text>
          {unread ? (
            <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>{conversation.unread_count > 99 ? '99+' : conversation.unread_count}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
