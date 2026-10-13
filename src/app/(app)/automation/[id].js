import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Banner, Button, Card, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useActivateWorkflow, useDeleteWorkflow, useExecutions, usePauseWorkflow, useWorkflow } from '@/features/automation/hooks';
import { EXECUTION_TONE, WORKFLOW_TONE, triggerLabel } from '@/features/automation/meta';
import { formatListTime } from '@/lib/format';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

export default function AutomationDetail() {
  const { id } = useLocalSearchParams();
  const user = useUser();
  const { colors, spacing } = useTheme();
  const workflow = useWorkflow(id);
  const runs = useExecutions(id);
  const activate = useActivateWorkflow();
  const pause = usePauseWorkflow();
  const remove = useDeleteWorkflow();
  const canManage = can(user, 'whatsapp.manage');
  const executions = useMemo(() => runs.data?.pages.flatMap((p) => p.executions) ?? [], [runs.data]);

  if (workflow.isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (workflow.isError) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Banner message={workflow.error.message} />
        <Button title="Try again" variant="outline" onPress={() => workflow.refetch()} />
      </View>
    );
  }

  const wf = workflow.data.workflow;
  const fail = (title) => (e) => Alert.alert(title, e.message);
  const busy = activate.isPending || pause.isPending || remove.isPending;

  function confirmDelete() {
    Alert.alert('Delete automation', `"${wf.name}" and its run history will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(wf.id, { onSuccess: () => router.back(), onError: fail('Could not delete') }) },
    ]);
  }

  const header = (
    <View style={{ gap: spacing.md, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="heading" style={{ flex: 1 }}>{wf.name}</Text>
        <Badge tone={WORKFLOW_TONE[wf.status] ?? 'muted'} label={wf.status} />
      </View>
      {wf.description ? <Text muted>{wf.description}</Text> : null}
      <Card style={{ gap: 4 }}>
        <Text variant="small" muted>Starts when</Text>
        <Text style={{ fontWeight: '600' }}>{triggerLabel(wf.trigger_type)}</Text>
        <Text variant="caption" muted>Version {wf.version}{wf.activated_at ? ` · active since ${formatListTime(wf.activated_at)}` : ''}</Text>
      </Card>

      {canManage ? (
        <View style={{ gap: spacing.sm }}>
          {wf.status === 'active' ? (
            <Button title="Pause automation" variant="secondary" loading={pause.isPending} disabled={busy} onPress={() => pause.mutate(wf.id, { onError: fail('Could not pause') })} />
          ) : (
            <Button title="Turn on" loading={activate.isPending} disabled={busy} onPress={() => activate.mutate(wf.id, { onError: fail('Could not turn on') })} />
          )}
          <Button title="Delete automation" variant="danger" loading={remove.isPending} disabled={busy} onPress={confirmDelete} />
        </View>
      ) : null}

      <Text variant="subheading" style={{ marginTop: spacing.sm }}>Run history</Text>
    </View>
  );

  return (
    <FlatList
      data={executions}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={header}
      onEndReached={() => runs.hasNextPage && !runs.isFetchingNextPage && runs.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={runs.isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : <View style={{ height: spacing.xl }} />}
      ListEmptyComponent={runs.isLoading ? <ActivityIndicator color={colors.primary} /> : <Text muted style={{ textAlign: 'center', padding: spacing.lg }}>It has not run yet.</Text>}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontWeight: '600' }}>{item.contact?.name || item.contact?.phone || 'Unknown contact'}</Text>
            <Text variant="caption" muted>{formatListTime(item.started_at)}{item.finished_at ? ` → ${formatListTime(item.finished_at)}` : ''}</Text>
          </View>
          <Badge tone={EXECUTION_TONE[item.status] ?? 'muted'} label={item.status} />
        </View>
      )}
    />
  );
}
