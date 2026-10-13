import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Badge, ProgressBar, Text } from '@/components/ui';
import { formatListTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { STATUS_TONE } from './meta';

export const BulkSendCard = memo(function BulkSendCard({ send, onPress }) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(send)}
      accessibilityRole="button"
      style={({ pressed }) => ({ padding: spacing.lg, gap: spacing.sm, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ flex: 1, fontFamily: 'monospace', fontWeight: '600' }} numberOfLines={1}>{send.template_name}</Text>
        <Badge tone={STATUS_TONE[send.status] ?? 'muted'} label={send.status} />
      </View>
      <Text variant="small" muted>
        {send.total} numbers · {send.language}{send.phone_number ? ` · from ${send.phone_number.display_phone_number}` : ''} · {formatListTime(send.created_at)}
      </Text>
      <ProgressBar value={send.sent_count + send.failed_count} total={send.total} tone={send.failed_count > 0 && send.sent_count === 0 ? 'danger' : 'primary'} />
      <View style={{ flexDirection: 'row', gap: spacing.lg }}>
        <Text variant="caption" muted>Sent {send.sent_count}</Text>
        {send.failed_count > 0 ? <Text variant="caption" color={colors.danger}>Failed {send.failed_count}</Text> : null}
      </View>
    </Pressable>
  );
});
