import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Badge, ProgressBar, Text } from '@/components/ui';
import { formatListTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { STATUS_TONE, doneCount } from './meta';

export const CampaignCard = memo(function CampaignCard({ campaign, onPress }) {
  const { colors, spacing } = useTheme();
  const done = doneCount(campaign);
  const when = campaign.scheduled_at && campaign.status === 'scheduled' ? `Scheduled ${formatListTime(campaign.scheduled_at)}` : formatListTime(campaign.created_at);

  return (
    <Pressable
      onPress={() => onPress(campaign)}
      accessibilityRole="button"
      style={({ pressed }) => ({ padding: spacing.lg, gap: spacing.sm, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>{campaign.name}</Text>
        <Badge tone={STATUS_TONE[campaign.status] ?? 'muted'} label={campaign.status} />
      </View>
      <Text variant="small" muted numberOfLines={1}>
        {campaign.template ? `${campaign.template.name} · ` : ''}{campaign.total_recipients} recipients · {when}
      </Text>
      <ProgressBar value={done} total={campaign.total_recipients} tone={campaign.failed_count > 0 && campaign.sent_count === 0 ? 'danger' : 'primary'} />
      <View style={{ flexDirection: 'row', gap: spacing.lg }}>
        <Text variant="caption" muted>Sent {campaign.sent_count}</Text>
        <Text variant="caption" muted>Delivered {campaign.delivered_count}</Text>
        <Text variant="caption" muted>Read {campaign.read_count}</Text>
        {campaign.failed_count > 0 ? <Text variant="caption" color={colors.danger}>Failed {campaign.failed_count}</Text> : null}
      </View>
    </Pressable>
  );
});
