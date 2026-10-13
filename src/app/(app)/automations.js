import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Banner, ChipSelect, EmptyState, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useWorkflows } from '@/features/automation/hooks';
import { WORKFLOW_TONE, triggerLabel } from '@/features/automation/meta';
import { formatListTime } from '@/lib/format';
import { hasFeature } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'draft', label: 'Draft' },
];

export default function Automations() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useWorkflows({ status });
  const workflows = useMemo(() => data?.pages.flatMap((p) => p.workflows) ?? [], [data]);

  if (!hasFeature(user, 'automations')) {
    return <EmptyState icon="lock-closed-outline" title="Automations are not in your plan" message="Upgrade your plan on the Heltog web app to use automations." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.md, paddingBottom: 0, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ChipSelect options={FILTERS} value={status} onChange={setStatus} />
      </View>
      <Banner tone="info" message="Build and edit flows on the Heltog web app. Here you can turn them on or off and see how they ran." style={{ margin: spacing.md, marginBottom: 0 }} />

      {isError && !data ? (
        <View style={{ padding: spacing.lg }}>
          <Banner message={error.message} />
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={workflows}
          keyExtractor={(w) => w.id}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
          ListEmptyComponent={<EmptyState icon="git-network-outline" title={status ? 'No automations with this status' : 'No automations yet'} message="Create automations on the web app." />}
          contentContainerStyle={workflows.length === 0 ? { flexGrow: 1 } : undefined}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/automation/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              style={({ pressed }) => ({ padding: spacing.lg, gap: 4, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
                <Badge tone={WORKFLOW_TONE[item.status] ?? 'muted'} label={item.status} />
              </View>
              <Text variant="small" muted numberOfLines={1}>{triggerLabel(item.trigger_type)} · {item.nodes_count ?? 0} steps · {item.executions_count ?? 0} runs</Text>
              {item.activated_at ? <Text variant="caption" muted>Active since {formatListTime(item.activated_at)}</Text> : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
