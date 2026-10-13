import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Banner, EmptyState, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useChatbots, useToggleChatbot } from '@/features/automation/hooks';
import { can, hasFeature, planAllows } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

export default function Chatbots() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useChatbots();
  const toggle = useToggleChatbot();
  const bots = useMemo(() => data?.pages.flatMap((p) => p.chatbots) ?? [], [data]);
  const canManage = can(user, 'whatsapp.manage');

  if (!hasFeature(user, 'chatbot') || !planAllows(user, 'max_chatbots')) {
    return <EmptyState icon="lock-closed-outline" title="Chatbot is not in your plan" message="Upgrade your plan on the Heltog web app to use chatbots." />;
  }
  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={bots}
        keyExtractor={(b) => b.id}
        refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
        ListEmptyComponent={<EmptyState icon="hardware-chip-outline" title="No chatbots yet" message={canManage ? 'Tap + to create a bot that answers common questions automatically.' : undefined} />}
        contentContainerStyle={bots.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/chatbot/[id]', params: { id: item.id } })}
            accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <Badge tone={item.is_active ? 'success' : 'muted'} label={item.is_active ? 'On' : 'Off'} />
                {item.ai_enabled ? <Badge tone="accent" label="AI replies" /> : null}
                <Badge label={`${item.rules_count ?? 0} rules`} />
              </View>
              <Text variant="caption" muted>{item.phone_number ? item.phone_number.display_phone_number : 'All numbers'}</Text>
            </View>
            {canManage ? (
              <Switch
                value={item.is_active}
                disabled={toggle.isPending}
                onValueChange={() => toggle.mutate(item.id, { onError: (e) => Alert.alert('Could not update', e.message) })}
                trackColor={{ true: colors.primary, false: colors.border }}
                accessibilityLabel={`Turn ${item.name} ${item.is_active ? 'off' : 'on'}`}
              />
            ) : null}
          </Pressable>
        )}
      />

      {canManage ? (
        <Pressable
          onPress={() => router.push('/chatbot-form')}
          accessibilityRole="button"
          accessibilityLabel="Create chatbot"
          style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}
