import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { Badge, Banner, Card, ChipSelect, EmptyState, ProgressBar, StatCard, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useCampaignStats, useMessageStats } from '@/features/analytics/hooks';
import { DailyChart } from '@/features/analytics/DailyChart';
import { STATUS_TONE } from '@/features/campaigns/meta';
import { can, hasFeature } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const n = (v) => Number(v ?? 0).toLocaleString();

export default function Analytics() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const [days, setDays] = useState(30);
  const allowed = can(user, 'analytics.view') && hasFeature(user, 'reports');
  const messages = useMessageStats(days, allowed);
  const campaigns = useCampaignStats(allowed);

  if (!allowed) {
    return <EmptyState icon="lock-closed-outline" title="Analytics are not available" message="Your role or plan does not include reports. Upgrade on the Heltog web app." />;
  }

  const totals = messages.data?.totals;
  const refreshing = messages.isRefetching || campaigns.isRefetching;

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { messages.refetch(); campaigns.refetch(); }} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <ChipSelect options={RANGES} value={days} onChange={setDays} />
      {messages.isError ? <Banner message={messages.error.message} /> : null}

      {messages.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />
      ) : totals ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <StatCard icon="arrow-up-outline" label="Sent" value={n(totals.total_sent)} />
            <StatCard icon="checkmark-done-outline" label="Delivered" value={n(totals.total_delivered)} tone="success" />
            <StatCard icon="eye-outline" label="Read" value={n(totals.total_read)} tone="success" />
            <StatCard icon="alert-circle-outline" label="Failed" value={n(totals.total_failed)} tone="danger" />
            <StatCard icon="arrow-down-outline" label="Received" value={n(totals.total_inbound)} tone="accent" />
            <StatCard icon="speedometer-outline" label="Delivery rate" value={`${totals.delivery_rate}%`} tone="success" />
            <StatCard icon="book-outline" label="Read rate" value={`${totals.read_rate}%`} tone="success" />
          </View>
          <Card style={{ gap: spacing.sm }}>
            <Text variant="subheading">Daily messages</Text>
            <DailyChart daily={messages.data.daily} />
          </Card>
        </>
      ) : null}

      <Text variant="subheading">Campaign performance</Text>
      {campaigns.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {campaigns.isError ? <Banner message={campaigns.error.message} /> : null}
      {campaigns.data && campaigns.data.campaigns.length === 0 ? <Text muted>No campaigns yet.</Text> : null}
      {campaigns.data?.campaigns.map((c, i) => (
        <Card key={`${c.name}-${i}`} style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>{c.name}</Text>
            <Badge tone={STATUS_TONE[c.status] ?? 'muted'} label={c.status} />
          </View>
          <ProgressBar value={c.delivered_count + c.read_count} total={c.total_recipients} tone="success" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <Text variant="caption" muted>{c.total_recipients} recipients</Text>
            <Text variant="caption" muted>Delivery {c.delivery_rate}%</Text>
            <Text variant="caption" muted>Read {c.read_rate}%</Text>
            {c.failed_count > 0 ? <Text variant="caption" color={colors.danger}>Failed {c.failed_count}</Text> : null}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
