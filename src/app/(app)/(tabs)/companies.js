import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Banner, EmptyState, Fab, ListSkeleton, Text } from '@/components/ui';
import { useCompanies } from '@/features/admin/hooks';
import { COMPANY_TONE } from '@/features/admin/meta';
import { formatListTime } from '@/lib/format';
import { fontRegular } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';

// Platform super admin: every company on Heltog.
export default function Companies() {
  const { colors, radius, spacing, fontSize } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useCompanies();
  const [query, setQuery] = useState('');

  const companies = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.companies ?? [];
    if (!q) return all;
    return all.filter((c) => [c.name, c.owner_name, c.owner_email, c.plan_name].some((v) => (v ?? '').toLowerCase().includes(q)));
  }, [data, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md }}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search company, owner or plan"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, color: colors.text, fontFamily: fontRegular, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
          />
        </View>
        {data ? <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{companies.length} of {data.companies.length} companies</Text> : null}
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
          data={companies}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="business-outline" title={query ? 'No matching companies' : 'No companies yet'} message={query ? undefined : 'Tap + to add the first one.'} />}
          contentContainerStyle={companies.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/company/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
            >
              <Avatar name={item.name} size={46} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={{ flexShrink: 1, fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
                  <Badge tone={COMPANY_TONE[item.status] ?? 'muted'} label={item.status} />
                </View>
                <Text variant="small" muted numberOfLines={1}>{item.owner_name ? `${item.owner_name} · ` : ''}{item.owner_email}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
                  <Badge tone={item.plan_name ? 'accent' : 'muted'} label={item.plan_name ?? 'No plan'} />
                  <Text variant="caption" muted>
                    {item.users_count} users · agents {item.agents_used ?? 0}/{item.agents_limit ?? '∞'}
                  </Text>
                </View>
                <Text variant="caption" muted>Joined {formatListTime(item.created_at)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Fab onPress={() => router.push('/company-form')} label="Add company" />
    </View>
  );
}
