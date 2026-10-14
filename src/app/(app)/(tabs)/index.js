import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge, Banner, Button, Card, StatCard, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { AdminDashboard } from '@/features/admin/AdminDashboard';
import { useDashboardStats } from '@/features/analytics/hooks';
import { useNumbers } from '@/features/whatsapp/hooks';
import { can, hasFeature, isPlanExpired, roleLabel } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

const n = (v) => (v ?? 0).toLocaleString();

function WorkspaceDashboard() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const tenantUser = !user.is_super_admin;
  const showStats = tenantUser && can(user, 'analytics.view');
  const showNumbers = tenantUser && can(user, 'whatsapp.view');
  const stats = useDashboardStats(showStats);
  const numbers = useNumbers(showNumbers);
  const sub = user.subscription;
  const company = user.tenant?.company_name ?? user.tenant?.name;
  const s = stats.data;

  async function refresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    await queryClient.invalidateQueries({ queryKey: ['wa-numbers'] });
    setRefreshing(false);
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      {isPlanExpired(user) ? <Banner tone="warning" message="Your subscription has ended. Renew your plan to keep using WhatsApp features." /> : null}
      <View>
        <Text variant="heading">Hi, {user.name.split(' ')[0]}</Text>
        {company ? <Text muted>{company}</Text> : null}
      </View>

      {tenantUser ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {can(user, 'conversations.view') ? <Button title="Inbox" variant="secondary" style={{ flexGrow: 1, flexBasis: '30%' }} onPress={() => router.navigate('/inbox')} /> : null}
          {can(user, 'campaigns.view') ? <Button title="Campaigns" variant="secondary" style={{ flexGrow: 1, flexBasis: '30%' }} onPress={() => router.navigate('/campaigns')} /> : null}
          {can(user, 'contacts.view') ? <Button title="Contacts" variant="secondary" style={{ flexGrow: 1, flexBasis: '30%' }} onPress={() => router.navigate('/contacts')} /> : null}
        </View>
      ) : null}

      {stats.isError ? <Banner message={stats.error.message} /> : null}

      {showStats ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <StatCard icon="people-outline" label="Contacts" value={n(s?.total_contacts)} />
            <StatCard icon="chatbubbles-outline" label="Conversations" value={n(s?.total_conversations)} />
            <StatCard icon="radio-button-on-outline" label="Open now" value={n(s?.open_conversations)} tone="success" />
            <StatCard icon="mail-outline" label="Messages today" value={n(s?.messages_today)} tone="accent" />
            {showNumbers ? <StatCard icon="logo-whatsapp" label="WhatsApp numbers" value={n(numbers.data?.numbers.length)} /> : null}
            {can(user, 'templates.view') ? <StatCard icon="checkmark-done-outline" label="Approved templates" value={n(s?.templates_approved)} tone="success" /> : null}
          </View>

          <Text variant="subheading">Messages</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <StatCard icon="arrow-up-outline" label="Sent today" value={n(s?.outbound_today)} />
            <StatCard icon="arrow-down-outline" label="Received today" value={n(s?.inbound_today)} tone="accent" />
            <StatCard icon="calendar-outline" label="This week" value={n(s?.messages_this_week)} />
            <StatCard icon="calendar-number-outline" label="This month" value={n(s?.messages_this_month)} />
          </View>

          {can(user, 'campaigns.view') ? (
            <>
              <Text variant="subheading">Campaigns</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <StatCard icon="rocket-outline" label="Running now" value={n(s?.active_campaigns)} tone="success" />
                <StatCard icon="megaphone-outline" label="Total campaigns" value={n(s?.total_campaigns)} tone="accent" />
              </View>
            </>
          ) : null}

          {hasFeature(user, 'reports') ? <Button title="Open analytics" variant="outline" onPress={() => router.push('/analytics')} /> : null}
        </>
      ) : null}

      <Card style={{ gap: spacing.sm }}>
        <Text variant="small" muted>Your role</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {user.roles.map((r) => <Badge key={r} label={roleLabel(r)} />)}
        </View>
      </Card>

      {sub ? (
        <Card style={{ gap: spacing.sm }}>
          <Text variant="small" muted>Plan</Text>
          <Text variant="subheading">{sub.plan_name ?? 'Plan'}</Text>
          <Badge tone={sub.status === 'active' || sub.status === 'trialing' ? 'success' : 'warning'} label={sub.status} />
          {sub.current_period_end ? <Text variant="small" muted>Renews / ends {new Date(sub.current_period_end).toLocaleDateString()}</Text> : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

export default function Dashboard() {
  const user = useUser();
  return user.is_super_admin ? <AdminDashboard user={user} /> : <WorkspaceDashboard />;
}
