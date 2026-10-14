import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Banner, ChipSelect, EmptyState, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { BulkSendCard } from '@/features/campaigns/BulkSendCard';
import { CampaignCard } from '@/features/campaigns/CampaignCard';
import { useBulkSends, useCampaigns } from '@/features/campaigns/hooks';
import { shareAllCampaignsReport } from '@/features/campaigns/report';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
];

// Shared list chrome for both tabs: loading, error, empty, pull-to-refresh, infinite scroll.
function PagedList({ query, items, renderItem, keyExtractor, empty }) {
  const { colors, spacing } = useTheme();
  const { isLoading, isError, error, data, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  if (isError && !data) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Banner message={error.message} />
        <Pressable onPress={() => refetch()} accessibilityRole="button">
          <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
      ListEmptyComponent={empty}
      contentContainerStyle={items.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
    />
  );
}

export default function CampaignsTab() {
  const user = useUser();
  const { colors, radius, spacing } = useTheme();
  const canManage = can(user, 'whatsapp.manage'); // the backend requires it for bulk sends and for creating/starting campaigns
  const [tab, setTab] = useState('campaigns');
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  async function exportAll() {
    setExporting(true);
    try {
      const count = await shareAllCampaignsReport();
      if (count === 0) Alert.alert('Nothing to export', 'You have no campaigns yet.');
    } catch (e) {
      Alert.alert('Could not create the report', e.message);
    } finally {
      setExporting(false);
    }
  }

  const campaigns = useCampaigns({ status });
  const bulk = useBulkSends();
  const campaignItems = useMemo(() => campaigns.data?.pages.flatMap((p) => p.campaigns) ?? [], [campaigns.data]);
  const bulkItems = useMemo(() => bulk.data?.pages.flatMap((p) => p.bulk_sends) ?? [], [bulk.data]);

  const openCampaign = useCallback((c) => router.push({ pathname: '/campaign/[id]', params: { id: c.id } }), []);
  const openBulk = useCallback((s) => router.push({ pathname: '/bulk/[id]', params: { id: s.uuid } }), []);

  const tabs = [{ key: 'campaigns', label: 'Campaigns' }, ...(canManage ? [{ key: 'bulk', label: 'Bulk send' }] : [])];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {tabs.length > 1 ? (
          <View style={{ flexDirection: 'row' }}>
            {tabs.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t.key }}
                style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 3, borderBottomColor: tab === t.key ? colors.primary : 'transparent' }}
              >
                <Text style={{ fontWeight: '700', color: tab === t.key ? colors.primary : colors.muted }}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {tab === 'campaigns' ? (
          <View style={{ padding: spacing.md, paddingBottom: 0 }}>
            <ChipSelect options={STATUS_FILTERS} value={status} onChange={setStatus} />
            <Pressable onPress={exportAll} disabled={exporting} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: spacing.sm, opacity: exporting ? 0.5 : 1 }}>
              {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="download-outline" size={18} color={colors.primary} />}
              <Text variant="small" color={colors.primary} style={{ fontWeight: '600' }}>{exporting ? 'Preparing report...' : 'Download all campaigns (CSV)'}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {tab === 'campaigns' ? (
        <PagedList
          query={campaigns}
          items={campaignItems}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <CampaignCard campaign={item} onPress={openCampaign} />}
          empty={<EmptyState icon="megaphone-outline" title={status ? 'No campaigns with this status' : 'No campaigns yet'} message={canManage ? 'Tap + to send a template to your contacts.' : undefined} />}
        />
      ) : (
        <PagedList
          query={bulk}
          items={bulkItems}
          keyExtractor={(s) => s.uuid}
          renderItem={({ item }) => <BulkSendCard send={item} onPress={openBulk} />}
          empty={<EmptyState icon="paper-plane-outline" title="No bulk sends yet" message="Send one template to a list of numbers." />}
        />
      )}

      {canManage ? (
        <Pressable
          onPress={() => router.push(tab === 'campaigns' ? '/campaign-form' : '/bulk-form')}
          accessibilityRole="button"
          accessibilityLabel={tab === 'campaigns' ? 'New campaign' : 'New bulk send'}
          style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}
