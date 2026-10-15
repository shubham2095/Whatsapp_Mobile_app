import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { STATUSES } from './hooks';

// A slim bar under the chat header: the chat's status (tap to change) and a button to add an internal note.
// Each side is hidden when the user lacks the permission or the server does not support it yet.
export function ChatStatusBar({ status, onChangeStatus, onAddNote, noteCount = 0 }) {
  const { colors, radius, spacing } = useTheme();
  const current = STATUSES.find((s) => s.key === status);
  const tint = current ? { success: colors.success, warning: colors.warning, neutral: colors.primary, muted: colors.muted }[current.tone] : colors.muted;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {onChangeStatus ? (
        <Pressable
          onPress={onChangeStatus}
          accessibilityRole="button"
          accessibilityLabel={`Chat status ${current?.label ?? 'unknown'}. Tap to change.`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: tint + '22' }}
        >
          <Ionicons name={current?.icon ?? 'ellipse-outline'} size={14} color={tint} />
          <Text variant="small" style={{ color: tint, fontWeight: '700' }}>{current?.label ?? 'Status'}</Text>
          <Ionicons name="chevron-down" size={13} color={tint} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }} />
      {onAddNote ? (
        <Pressable
          onPress={onAddNote}
          accessibilityRole="button"
          accessibilityLabel="Add internal note"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.chipBg }}
        >
          <Ionicons name="create-outline" size={14} color={colors.primary} />
          <Text variant="small" style={{ color: colors.primary, fontWeight: '600' }}>
            Note{noteCount > 0 ? ` (${noteCount})` : ''}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
