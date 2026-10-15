import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionSheet, Badge, Banner, EmptyState, Fab, ListSkeleton, Text } from '@/components/ui';
import { useAdminPlans, useDeletePlan, useTogglePlan } from '@/features/admin/hooks';
import { FEATURE_LABELS, LIMIT_LABELS, showLimit } from '@/features/billing/planMeta';
import { useTheme } from '@/theme/ThemeProvider';

// Platform super admin: subscription plans. (Company users see their own plan screen at /plans.)
export default function AdminPlans() {
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminPlans();
  const toggle = useTogglePlan();
  const remove = useDeletePlan();
  const [menuFor, setMenuFor] = useState(null);
  const fail = (title) => (e) => Alert.alert(title, e.message);

  function confirmDelete(p) {
    Alert.alert('Delete plan', `"${p.name}" will be removed. Plans that companies are subscribed to cannot be deleted; deactivate them instead.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(p.id, { onError: fail('Could not delete') }) },
    ]);
  }

  const menu = menuFor
    ? [
        { label: 'Edit plan', icon: 'create-outline', onPress: () => router.push({ pathname: '/plan-form', params: { id: menuFor.id } }) },
        {
          label: menuFor.is_active ? 'Deactivate' : 'Activate',
          icon: menuFor.is_active ? 'pause-circle-outline' : 'play-circle-outline',
          onPress: () => toggle.mutate(menuFor.id, { onError: fail('Could not update') }),
        },
        { label: 'Delete', icon: 'trash-outline', danger: true, onPress: () => confirmDelete(menuFor) },
      ]
    : [];

  if (isLoading) return <ListSkeleton variant="card" />;
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={data.plans}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="pricetags-outline" title="No plans yet" message="Tap + to create one." />}
        contentContainerStyle={data.plans.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
        renderItem={({ item }) => {
          const features = Object.keys(item.features ?? {}).filter((k) => item.features[k]);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/plan-form', params: { id: item.id } })}
              accessibilityRole="button"
              style={({ pressed }) => ({ padding: spacing.lg, gap: 6, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: item.is_active ? 1 : 0.65 })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ flex: 1, fontWeight: '700' }} numberOfLines={1}>{item.name}</Text>
                <Pressable onPress={() => setMenuFor(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Actions for ${item.name}`}>
                  <Ionicons name="ellipsis-vertical" size={20} color={colors.muted} />
                </Pressable>
              </View>
              <Text variant="heading">{item.price > 0 ? `₹${item.price.toLocaleString('en-IN')}` : 'Free'}<Text muted variant="small"> / {item.billing_period === 'yearly' ? 'year' : 'month'}</Text></Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <Badge tone={item.is_active ? 'success' : 'muted'} label={item.is_active ? 'Active' : 'Inactive'} />
                {item.is_public ? null : <Badge tone="warning" label="Hidden" />}
                <Badge label={`${item.subscribers} ${item.subscribers === 1 ? 'company' : 'companies'}`} />
              </View>
              <Text variant="caption" muted numberOfLines={2}>
                {Object.keys(LIMIT_LABELS).map((k) => `${LIMIT_LABELS[k]} ${showLimit(item.limits?.[k])}`).join(' · ')}
              </Text>
              {features.length > 0 ? <Text variant="caption" muted numberOfLines={2}>{features.map((k) => FEATURE_LABELS[k] ?? k.replace(/_/g, ' ')).join(', ')}</Text> : null}
            </Pressable>
          );
        }}
      />

      <ActionSheet visible={!!menuFor} title={menuFor?.name} actions={menu} onClose={() => setMenuFor(null)} />

      <Fab onPress={() => router.push('/plan-form')} label="Create plan" />
    </View>
  );
}
