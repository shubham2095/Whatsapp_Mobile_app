import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { usePlans } from '@/features/billing/hooks';
import { PlanCard } from '@/features/billing/PlanCard';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

export default function Plans() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = usePlans();
  const canBuy = can(user, 'billing.manage');
  const currentName = user.subscription?.plan_name;

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      {canBuy ? (
        <Text variant="small" muted>Prices are per billing period and exclude {data.gst_rate}% GST, which is added at checkout.</Text>
      ) : (
        <Banner tone="info" message="Only the account owner can buy or change a plan. You can still compare the plans here." />
      )}
      {data.plans.map((p) => (
        <PlanCard
          key={p.id}
          plan={p}
          current={p.name === currentName}
          canBuy={canBuy}
          onChoose={(plan) => router.push({ pathname: '/checkout', params: { planId: plan.id } })}
        />
      ))}
      {data.plans.length === 0 ? <Text muted style={{ textAlign: 'center' }}>No plans are available right now.</Text> : null}
    </ScrollView>
  );
}
