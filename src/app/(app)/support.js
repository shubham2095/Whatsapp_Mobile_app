import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Banner, ChipSelect, EmptyState, Text, ListSkeleton } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { PRIORITY_TONE, STATUSES, STATUS_TONE, statusLabel } from '@/features/support/meta';
import { useTickets } from '@/features/support/hooks';
import { formatListTime } from '@/lib/format';
import { fontRegular } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';

const FILTERS = [{ value: '', label: 'All' }, ...STATUSES];

export default function Support() {
  const user = useUser();
  const admin = user.is_super_admin; // a platform admin answers every company's tickets
  const { colors, radius, spacing, fontSize } = useTheme();
  const [status, setStatus] = useState('');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useTickets({ admin, status, search });
  const tickets = useMemo(() => data?.pages.flatMap((p) => p.tickets) ?? [], [data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Search ticket ID or subject"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, color: colors.text, fontFamily: fontRegular, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
          />
        </View>
        <ChipSelect options={FILTERS} value={status} onChange={setStatus} />
      </View>

      {isError && !data ? (
        <View style={{ padding: spacing.lg }}>
          <Banner message={error.message} />
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="help-buoy-outline"
              title={search || status ? 'No matching tickets' : 'No tickets yet'}
              message={admin ? undefined : 'Need help? Tap + to raise a ticket with the Heltog team.'}
            />
          }
          contentContainerStyle={tickets.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/ticket/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              style={({ pressed }) => ({ padding: spacing.lg, gap: 4, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="caption" muted style={{ fontFamily: 'monospace' }}>{item.ticket_id}</Text>
                <View style={{ flex: 1 }} />
                <Badge tone={PRIORITY_TONE[item.priority] ?? 'muted'} label={item.priority} />
                <Badge tone={STATUS_TONE[item.status] ?? 'muted'} label={statusLabel(item.status)} />
              </View>
              <Text style={{ fontWeight: '600' }} numberOfLines={2}>{item.subject}</Text>
              <Text variant="caption" muted numberOfLines={1}>
                {admin && item.tenant_name ? `${item.tenant_name} · ` : ''}{formatListTime(item.created_at)}{item.admin_reply ? ' · replied' : ''}
              </Text>
            </Pressable>
          )}
        />
      )}

      {admin ? null : (
        <Pressable
          onPress={() => router.push('/support-form')}
          accessibilityRole="button"
          accessibilityLabel="New ticket"
          style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
