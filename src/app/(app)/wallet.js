import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { Banner, Card, EmptyState, Text } from '@/components/ui';
import { useWallet } from '@/features/billing/hooks';
import { formatListTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

export default function Wallet() {
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useWallet();

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) return <View style={{ padding: spacing.lg }}><Banner message={error.message} /></View>;

  return (
    <FlatList
      data={data.transactions}
      keyExtractor={(t) => t.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
      ListHeaderComponent={
        <Card style={{ margin: spacing.lg, gap: spacing.xs }}>
          <Text variant="small" muted>Balance</Text>
          <Text variant="title">{data.wallet.balance}</Text>
          <Text variant="caption" muted>Last 50 transactions</Text>
        </Card>
      }
      ListEmptyComponent={<EmptyState icon="wallet-outline" title="No transactions yet" />}
      renderItem={({ item }) => {
        const credit = item.amount_minor >= 0;
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }} numberOfLines={2}>{item.description || item.type}</Text>
              <Text variant="caption" muted>{formatListTime(item.created_at)} · balance {item.balance_after}</Text>
            </View>
            <Text style={{ fontWeight: '700', color: credit ? colors.success : colors.danger }}>{credit ? '+' : ''}{item.amount}</Text>
          </View>
        );
      }}
    />
  );
}
