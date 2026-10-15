import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Banner, EmptyState, Text, ListSkeleton } from '@/components/ui';
import { useInvoices } from '@/features/billing/hooks';
import { formatListTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

export default function Invoices() {
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInvoices();
  const invoices = useMemo(() => data?.pages.flatMap((p) => p.invoices) ?? [], [data]);

  if (isLoading) return <ListSkeleton />;
  if (isError && !data) return <View style={{ padding: spacing.lg }}><Banner message={error.message} /></View>;

  return (
    <FlatList
      data={invoices}
      keyExtractor={(i) => i.id}
      refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
      ListEmptyComponent={<EmptyState icon="receipt-outline" title="No invoices yet" message="Invoices appear here after you buy a plan." />}
      contentContainerStyle={invoices.length === 0 ? { flexGrow: 1 } : undefined}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: item.id } })}
          accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontWeight: '600' }}>{item.number}</Text>
            <Text variant="small" muted numberOfLines={1}>{item.line_items?.[0]?.description ?? 'Subscription'}</Text>
            <Text variant="caption" muted>{formatListTime(item.issued_at)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontWeight: '700' }}>{item.total}</Text>
            <Badge tone={item.status === 'paid' ? 'success' : 'warning'} label={item.status} />
          </View>
        </Pressable>
      )}
    />
  );
}
