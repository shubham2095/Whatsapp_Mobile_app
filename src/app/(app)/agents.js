import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Badge, Banner, EmptyState, Text, ListSkeleton } from '@/components/ui';
import { useAgents } from '@/features/team/hooks';
import { roleLabel } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

function Count({ label, value }) {
  const { spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', minWidth: 56, paddingVertical: spacing.xs }}>
      <Text style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}

export default function Agents() {
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useAgents();

  if (isLoading) return <ListSkeleton />;
  if (isError) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Banner message={error.message} />
        <Pressable onPress={() => refetch()} accessibilityRole="button">
          <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(a) => a.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
      ListEmptyComponent={<EmptyState icon="headset-outline" title="No agents yet" message="Add agents from Team." />}
      contentContainerStyle={data.length === 0 ? { flexGrow: 1 } : undefined}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/agent/[id]', params: { id: item.id } })}
          accessibilityRole="button"
          style={({ pressed }) => ({ padding: spacing.lg, gap: spacing.sm, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar name={item.name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
              <Text variant="small" muted numberOfLines={1}>{item.email}</Text>
            </View>
            {item.roles.slice(0, 1).map((r) => <Badge key={r} label={roleLabel(r)} />)}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.bg, borderRadius: 10 }}>
            <Count label="Active" value={item.active_conversations_count} />
            <Count label="Open" value={item.stats?.open ?? 0} />
            <Count label="Pending" value={item.stats?.pending ?? 0} />
            <Count label="Resolved" value={item.stats?.resolved ?? 0} />
            <Count label="Handled" value={item.total_handled} />
          </View>
        </Pressable>
      )}
    />
  );
}
