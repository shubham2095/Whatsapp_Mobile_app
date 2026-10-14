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

// Long-press pins or unpins the chat (pins are kept on this phone, like the web app's sticky chats).
export const ConversationRow = memo(function ConversationRow({ conversation, onPress, onLongPress, pinned = false }) {
  const { colors, spacing } = useTheme();
  const unread = conversation.unread_count > 0;
  const name = contactLabel(conversation);
  const contact = conversation.contact;

  return (
    <Pressable
      onPress={() => onPress(conversation)}
      onLongPress={() => onLongPress?.(conversation)}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityHint="Long press to pin or unpin this chat"
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
          {contact?.is_hot ? <Ionicons name="flame" size={15} color={colors.accent} /> : null}
          <View style={{ flex: 1 }} />
          {pinned ? <Ionicons name="pin" size={13} color={colors.muted} /> : null}
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
          {conversation.assigned_agent ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, maxWidth: 110 }}>
              <Ionicons name="person" size={11} color={colors.muted} />
              <Text variant="caption" muted numberOfLines={1}>{conversation.assigned_agent.name}</Text>
            </View>
          ) : null}
          {unread ? (
            <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>{conversation.unread_count > 99 ? '99+' : conversation.unread_count}</Text>
            </View>
          ) : null}
        </View>
        {contact?.is_hot ? (
          <Text variant="caption" color={colors.accent} numberOfLines={1} style={{ marginTop: 2 }}>
            {contact.hot_score ?? 50}/100{contact.hot_reason ? ` · ${contact.hot_reason}` : ' · Hot lead'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});
