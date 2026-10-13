import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Banner, Button, Card, ProgressBar, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import {
  useCampaign,
  useCancelCampaign,
  useDeleteCampaign,
  usePauseCampaign,
  useStartCampaign,
} from '@/features/campaigns/hooks';
import { STATUS_TONE, doneCount, pct } from '@/features/campaigns/meta';
import { formatListTime } from '@/lib/format';
import { can } from '@/lib/permissions';
import { displayPhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

function Metric({ label, value, sub }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: '30%', gap: 2 }}>
      <Text variant="heading" style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text variant="caption" muted>{label}</Text>
      {sub ? <Text variant="caption" muted>{sub}</Text> : null}
    </View>
  );
}

export default function CampaignDetail() {
  const { id } = useLocalSearchParams();
  const user = useUser();
  const { colors, spacing } = useTheme();
  const query = useCampaign(id);
  const start = useStartCampaign();
  const pause = usePauseCampaign();
  const cancel = useCancelCampaign();
  const remove = useDeleteCampaign();

  const campaign = query.data?.pages[0]?.campaign;
  const recipients = useMemo(() => query.data?.pages.flatMap((p) => p.campaign_contacts) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  const canManage = can(user, 'whatsapp.manage');

  if (query.isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (query.isError && !campaign) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Banner message={query.error.message} />
        <Button title="Try again" variant="outline" onPress={() => query.refetch()} />
      </View>
    );
  }

  const fail = (title) => (e) => Alert.alert(title, e.message);
  const status = campaign.status;
  const busy = start.isPending || pause.isPending || cancel.isPending || remove.isPending;

  function confirmStart() {
    Alert.alert('Start campaign', `Send "${campaign.template?.name}" to ${campaign.total_recipients} contacts now? Messages cannot be recalled once sent.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start sending', onPress: () => start.mutate(campaign.id, { onError: fail('Could not start') }) },
    ]);
  }
  function confirmCancel() {
    Alert.alert('Cancel campaign', 'Messages already sent stay sent; the rest will not be sent.', [
      { text: 'Keep running', style: 'cancel' },
      { text: 'Cancel campaign', style: 'destructive', onPress: () => cancel.mutate(campaign.id, { onError: fail('Could not cancel') }) },
    ]);
  }
  function confirmDelete() {
    Alert.alert('Delete campaign', 'This draft will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(campaign.id, { onSuccess: () => router.back(), onError: fail('Could not delete') }) },
    ]);
  }

  const header = (
    <View style={{ gap: spacing.md, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="heading" style={{ flex: 1 }}>{campaign.name}</Text>
        <Badge tone={STATUS_TONE[status] ?? 'muted'} label={status} />
      </View>
      <Text variant="small" muted>
        {campaign.template ? `${campaign.template.name} (${campaign.template.language})` : 'Template removed'}
        {campaign.phone_number ? ` · from ${campaign.phone_number.display_phone_number}` : ''}
      </Text>
      {status === 'scheduled' && campaign.scheduled_at ? <Banner tone="info" message={`Scheduled for ${new Date(campaign.scheduled_at).toLocaleString()}`} /> : null}
      {status === 'paused' ? <Banner tone="warning" message="Paused campaigns cannot be resumed. Cancel it and create a new campaign for the remaining contacts." /> : null}

      <Card style={{ gap: spacing.md }}>
        <ProgressBar value={doneCount(campaign)} total={campaign.total_recipients} />
        <Text variant="small" muted>{doneCount(campaign)} of {campaign.total_recipients} processed</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <Metric label="Sent" value={campaign.sent_count} />
          <Metric label="Delivered" value={campaign.delivered_count} sub={pct(campaign.delivered_count, campaign.sent_count + campaign.delivered_count + campaign.read_count)} />
          <Metric label="Read" value={campaign.read_count} sub={pct(campaign.read_count, campaign.sent_count + campaign.delivered_count + campaign.read_count)} />
          <Metric label="Failed" value={campaign.failed_count} />
          <Metric label="Replied" value={campaign.replied_count} />
        </View>
        {campaign.started_at ? <Text variant="caption" muted>Started {formatListTime(campaign.started_at)}</Text> : null}
        {campaign.completed_at ? <Text variant="caption" muted>Finished {formatListTime(campaign.completed_at)}</Text> : null}
      </Card>

      {canManage ? (
        <View style={{ gap: spacing.sm }}>
          {status === 'draft' || status === 'scheduled' ? <Button title="Start sending" loading={start.isPending} disabled={busy} onPress={confirmStart} /> : null}
          {status === 'running' ? <Button title="Pause" variant="secondary" loading={pause.isPending} disabled={busy} onPress={() => pause.mutate(campaign.id, { onError: fail('Could not pause') })} /> : null}
          {['draft', 'scheduled', 'running', 'paused'].includes(status) ? <Button title="Cancel campaign" variant="outline" disabled={busy} onPress={confirmCancel} /> : null}
          {status === 'draft' ? <Button title="Delete draft" variant="danger" loading={remove.isPending} disabled={busy} onPress={confirmDelete} /> : null}
        </View>
      ) : null}

      <Text variant="subheading" style={{ marginTop: spacing.sm }}>Recipients ({total})</Text>
    </View>
  );

  return (
    <FlatList
      data={recipients}
      keyExtractor={(r) => String(r.id)}
      ListHeaderComponent={header}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : <View style={{ height: spacing.xl }} />}
      ListEmptyComponent={<Text muted style={{ textAlign: 'center', padding: spacing.lg }}>No recipients matched this campaign.</Text>}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontWeight: '600' }}>{item.contact?.name || displayPhone(String(item.contact?.phone ?? '').replace(/\D/g, '')) || 'Deleted contact'}</Text>
            {item.contact?.name ? <Text variant="caption" muted>{item.contact.phone}</Text> : null}
          </View>
          <Badge tone={STATUS_TONE[item.status] ?? 'muted'} label={item.status} />
        </View>
      )}
    />
  );
}
