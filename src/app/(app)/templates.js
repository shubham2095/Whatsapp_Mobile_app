import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Banner, Button, EmptyState, Fab, ListSkeleton, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useSyncTemplates, useTemplates } from '@/features/templates/hooks';
import { CATEGORY_LABEL, CATEGORY_TONE, STATUS_TONE } from '@/features/templates/meta';
import { can, planAllows } from '@/lib/permissions';
import { fontRegular } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function Templates() {
  const user = useUser();
  const { colors, radius, spacing, fontSize } = useTheme();
  const [status, setStatus] = useState('');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useTemplates({ search, status });
  const sync = useSyncTemplates();
  const templates = useMemo(() => data?.pages.flatMap((p) => p.templates) ?? [], [data]);

  const open = useCallback((t) => router.push({ pathname: '/template/[id]', params: { id: t.id } }), []);

  function runSync() {
    setNotice(null);
    sync.mutate(undefined, {
      onSuccess: (res) => setNotice({ tone: 'success', text: res.message }),
      onError: (e) => setNotice({ tone: 'danger', text: e.message }),
    });
  }

  if (!planAllows(user, 'max_templates')) {
    return <EmptyState icon="lock-closed-outline" title="Templates are not in your plan" message="Upgrade your plan on the Heltog web app to create and use templates." />;
  }

  const canCreate = can(user, 'templates.create');
  const canSync = can(user, 'templates.sync');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.md, gap: spacing.sm, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md }}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Search templates"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, color: colors.text, fontFamily: fontRegular, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => {
            const active = status === f.key;
            return (
              <Pressable
                key={f.label}
                onPress={() => setStatus(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{ paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: active ? colors.primary : colors.chipBg }}
              >
                <Text variant="small" style={{ color: active ? '#fff' : colors.primary, fontWeight: '600' }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {canSync ? <Button title="Sync from Meta" variant="outline" loading={sync.isPending} onPress={runSync} /> : null}
      </View>

      {notice ? <View style={{ padding: spacing.md, paddingBottom: 0 }}><Banner tone={notice.tone} message={notice.text} /></View> : null}

      {isError && !data ? (
        <View style={{ padding: spacing.lg }}>
          <Banner message={error.message} />
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <ListSkeleton variant="card" />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(t) => t.id}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title={search || status ? 'No matching templates' : 'No templates yet'}
              message={search || status ? 'Try a different search or filter.' : 'Create one, or sync your approved templates from Meta.'}
            />
          }
          contentContainerStyle={templates.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              accessibilityRole="button"
              style={({ pressed }) => ({ padding: spacing.lg, gap: 6, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ flex: 1, fontFamily: 'monospace', fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
                <Badge tone={STATUS_TONE[item.status] ?? 'neutral'} label={item.status} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="small" muted>{item.language}</Text>
                <Badge tone={CATEGORY_TONE[item.category] ?? 'neutral'} label={CATEGORY_LABEL[item.category] ?? item.category} />
              </View>
              {item.status === 'REJECTED' && item.rejection_reason ? <Text variant="small" color={colors.danger} numberOfLines={2}>{item.rejection_reason}</Text> : null}
            </Pressable>
          )}
        />
      )}

      {canCreate ? (
        <Fab onPress={() => router.push('/template-form')} label="Create template" />
      ) : null}
    </View>
  );
}
