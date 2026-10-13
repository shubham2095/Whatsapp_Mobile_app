import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Banner, EmptyState, Text } from '@/components/ui';
import { ConversationRow, contactLabel } from '@/features/inbox/ConversationRow';
import { useConversations } from '@/features/inbox/hooks';
import { useTheme } from '@/theme/ThemeProvider';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'hot', label: 'Hot' },
];

export default function InboxTab() {
  const { colors, radius, spacing, fontSize } = useTheme();
  const [filter, setFilter] = useState('all');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  // "Hot" is not a server status: fetch everything and keep hot leads client-side (as the web app does).
  const query = useConversations({ status: filter === 'open' ? 'open' : undefined, search });
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const conversations = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.conversations) ?? [];
    return filter === 'hot' ? all.filter((c) => c.contact?.is_hot) : all;
  }, [data, filter]);

  const openChat = useCallback((c) => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: c.id, name: contactLabel(c), phone: c.contact?.phone ?? c.contact?.wa_id ?? '', windowOpen: String(c.window_open) },
    });
  }, []);

  const renderItem = useCallback(({ item }) => <ConversationRow conversation={item} onPress={openChat} />, [openChat]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.md, gap: spacing.sm, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md }}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Search name or number"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            autoCorrect={false}
            style={{ flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
          />
          {input ? (
            <Pressable onPress={() => setInput('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: active ? colors.primary : colors.chipBg,
                }}
              >
                <Text variant="small" style={{ color: active ? '#fff' : colors.primary, fontWeight: '600' }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title={search ? 'No matching chats' : filter === 'hot' ? 'No hot leads yet' : 'No conversations yet'}
              message={search ? 'Try a different name or number.' : 'New WhatsApp chats will appear here.'}
            />
          }
          contentContainerStyle={conversations.length === 0 ? { flexGrow: 1 } : undefined}
        />
      )}
    </View>
  );
}
