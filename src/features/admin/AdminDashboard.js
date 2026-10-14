import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Banner, Button, Card, StatCard, Text } from '@/components/ui';
import { useTickets } from '@/features/support/hooks';
import { formatListTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { useAdminPlans, useCompanies } from './hooks';
import { COMPANY_TONE } from './meta';

const n = (v) => (v ?? 0).toLocaleString();

// Platform overview for the super admin: companies, plans and open support tickets.
export function AdminDashboard({ user }) {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const companies = useCompanies();
  const plans = useAdminPlans();
  const tickets = useTickets({ admin: true, status: 'open' });

  const list = companies.data?.companies ?? [];
  const active = list.filter((c) => c.status === 'active').length;
  const suspended = list.filter((c) => c.status === 'suspended').length;
  const noPlan = list.filter((c) => !c.plan_name).length;
  const users = list.reduce((sum, c) => sum + (c.users_count ?? 0), 0);
  const activePlans = (plans.data?.plans ?? []).filter((p) => p.is_active).length;
  const openTickets = tickets.data?.pages[0]?.meta.total;
  const error = companies.error ?? plans.error;

  async function refresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
    await queryClient.invalidateQueries({ queryKey: ['support'] });
    setRefreshing(false);
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View>
        <Text variant="heading">Hi, {user.name.split(' ')[0]}</Text>
        <Text muted>Platform admin</Text>
      </View>

      {error ? <Banner message={error.message} /> : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button title="Add company" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/company-form')} />
        <Button title="New plan" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/plan-form')} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <StatCard icon="business-outline" label="Companies" value={n(list.length)} />
        <StatCard icon="checkmark-circle-outline" label="Active" value={n(active)} tone="success" />
        <StatCard icon="pause-circle-outline" label="Suspended" value={n(suspended)} tone="danger" />
        <StatCard icon="alert-circle-outline" label="Without a plan" value={n(noPlan)} tone="accent" />
        <StatCard icon="people-outline" label="Users" value={n(users)} />
        <StatCard icon="pricetags-outline" label="Active plans" value={n(activePlans)} />
      </View>

      <Pressable onPress={() => router.push('/support')} accessibilityRole="button">
        <StatCard icon="help-buoy-outline" label="Open support tickets" value={openTickets === undefined ? '-' : n(openTickets)} tone={openTickets ? 'accent' : 'success'} />
      </Pressable>

      <Text variant="subheading">Newest companies</Text>
      {list.length === 0 ? <Text muted>No companies yet.</Text> : null}
      {list.slice(0, 5).map((c) => (
        <Pressable key={c.id} onPress={() => router.push({ pathname: '/company/[id]', params: { id: c.id } })} accessibilityRole="button">
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>{c.name}</Text>
              <Badge tone={COMPANY_TONE[c.status] ?? 'muted'} label={c.status} />
            </View>
            <Text variant="small" muted numberOfLines={1}>{c.plan_name ?? 'No plan'} · {c.owner_email} · {formatListTime(c.created_at)}</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
