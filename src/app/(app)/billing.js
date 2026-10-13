import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Banner, Button, Card, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useBillingOverview } from '@/features/billing/hooks';
import { periodLabel } from '@/features/billing/planMeta';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

const STATUS_TONE = { active: 'success', trialing: 'success', expired: 'danger', cancelled: 'muted', past_due: 'warning' };

function LinkRow({ icon, label, onPress }) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, opacity: pressed ? 0.6 : 1 })}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={{ flex: 1 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function Billing() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useBillingOverview();
  const canManage = can(user, 'billing.manage');

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </ScrollView>
    );
  }

  const sub = data.subscription;
  const plan = sub?.plan;
  const ends = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      {sub?.status === 'expired' ? <Banner message="Your subscription has ended. Renew your plan to use WhatsApp features again." /> : null}

      <Card style={{ gap: spacing.sm }}>
        <Text variant="small" muted>Current plan</Text>
        {sub ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="heading" style={{ flex: 1 }}>{plan?.name ?? 'Plan'}</Text>
              <Badge tone={STATUS_TONE[sub.status] ?? 'neutral'} label={sub.status} />
            </View>
            {plan ? <Text muted>{plan.price > 0 ? `${plan.price_display} / ${periodLabel(plan)}` : 'Free'}</Text> : null}
            {ends ? <Text variant="small" muted>{sub.status === 'expired' ? 'Ended' : 'Renews / ends'} {ends}</Text> : null}
            {sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date(sub.current_period_start ?? 0) ? (
              <Text variant="small" muted>Trial ends {new Date(sub.trial_ends_at).toLocaleDateString()}</Text>
            ) : null}
          </>
        ) : (
          <Text muted>No plan yet.</Text>
        )}
        <Button title={sub ? (sub.status === 'expired' ? 'Renew plan' : 'Change plan') : 'Choose a plan'} disabled={!canManage} onPress={() => router.push('/plans')} />
        {canManage ? null : <Text variant="caption" muted>Only the account owner can buy or change a plan.</Text>}
      </Card>

      <Card style={{ gap: spacing.xs }}>
        <Text variant="small" muted>Wallet balance</Text>
        <Text variant="title">{data.wallet.balance}</Text>
        {data.wallet.reserved && data.wallet.balance_minor !== undefined && data.wallet.reserved !== '₹0.00' ? <Text variant="small" muted>Reserved {data.wallet.reserved}</Text> : null}
      </Card>

      <Card style={{ paddingVertical: spacing.xs }}>
        <LinkRow icon="wallet-outline" label="Wallet history" onPress={() => router.push('/wallet')} />
        <LinkRow icon="receipt-outline" label="Invoices" onPress={() => router.push('/invoices')} />
        <LinkRow icon="pricetags-outline" label="All plans" onPress={() => router.push('/plans')} />
      </Card>
    </ScrollView>
  );
}
