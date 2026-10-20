import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionSheet, Banner, EmptyState, FadeInItem, Text, ListSkeleton } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useUser } from '@/features/auth/AuthProvider';
import { ConversationRow, contactLabel } from '@/features/inbox/ConversationRow';
import { useConversations, useMarkRead } from '@/features/inbox/hooks';
import { SwipeableConversation } from '@/features/inbox/SwipeableConversation';
import { usePinnedChats } from '@/features/inbox/usePinnedChats';
import { haptics } from '@/lib/haptics';
import { fontRegular } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'hot', label: 'Hot' },
  { key: 'pinned', label: 'Pinned' },
];

export default function InboxTab() {
  const user = useUser();
  const toast = useToast();
  const { colors, radius, spacing, fontSize } = useTheme();
  const [filter, setFilter] = useState('all');
  const [agent, setAgent] = useState(''); // '' = every agent
  const [agentMenu, setAgentMenu] = useState(false);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const { pinned, toggle: togglePin } = usePinnedChats(user.id);

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  // "Hot" and "Pinned" are not server statuses: fetch everything and filter here (as the web app does).
  const query = useConversations({ status: filter === 'open' ? 'open' : undefined, search });
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const all = useMemo(() => data?.pages.flatMap((p) => p.conversations) ?? [], [data]);
  // Agents are read from the chats loaded so far (the same way the web app builds its dropdown).
  const agents = useMemo(() => [...new Set(all.map((c) => c.assigned_agent?.name).filter(Boolean))].sort(), [all]);

  const conversations = useMemo(() => {
    const filtered = all
      .filter((c) => filter !== 'hot' || c.contact?.is_hot)
      .filter((c) => filter !== 'pinned' || pinned.has(c.id))
      .filter((c) => !agent || c.assigned_agent?.name === agent);
    // Pinned chats float to the top; the server order is otherwise kept (Array.sort is stable).
    return [...filtered].sort((a, b) => Number(pinned.has(b.id)) - Number(pinned.has(a.id)));
  }, [all, filter, agent, pinned]);

  const openChat = useCallback((c) => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: c.id, name: contactLabel(c), phone: c.contact?.phone ?? c.contact?.wa_id ?? '', windowOpen: String(c.window_open) },
    });
  }, []);

  const markRead = useMarkRead();
  const pinToggle = useCallback(
    (c) => {
      togglePin(c.id);
      toast.show(pinned.has(c.id) ? 'Chat unpinned' : 'Chat pinned');
    },
    [togglePin, pinned, toast],
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <FadeInItem index={index}>
        <SwipeableConversation
          pinned={pinned.has(item.id)}
          unread={item.unread_count > 0}
          onTogglePin={() => pinToggle(item)}
          onMarkRead={() => markRead.mutate(item.id)}
        >
          <ConversationRow
            conversation={item}
            onPress={openChat}
            onLongPress={(c) => {
              haptics.press();
              pinToggle(c);
            }}
            pinned={pinned.has(item.id)}
          />
        </SwipeableConversation>
      </FadeInItem>
    ),
    [openChat, pinToggle, pinned, markRead],
  );

  const agentActions = [
    { label: 'All agents', icon: agent === '' ? 'checkmark' : undefined, onPress: () => setAgent('') },
    ...agents.map((name) => ({ label: name, icon: agent === name ? 'checkmark' : 'person-outline', onPress: () => setAgent(name) })),
  ];

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
            style={{ flex: 1, color: colors.text, fontFamily: fontRegular, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
          />
          {input ? (
            <Pressable onPress={() => setInput('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{ paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: active ? colors.primary : colors.chipBg }}
              >
                <Text variant="small" style={{ color: active ? '#fff' : colors.primary, fontWeight: '600' }}>{f.label}</Text>
              </Pressable>
            );
          })}
          {agents.length > 0 ? (
            <Pressable
              onPress={() => setAgentMenu(true)}
              accessibilityRole="button"
              accessibilityLabel="Filter by agent"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: agent ? colors.accent : colors.chipBg }}
            >
              <Ionicons name="person" size={13} color={agent ? '#fff' : colors.primary} />
              <Text variant="small" style={{ color: agent ? '#fff' : colors.primary, fontWeight: '600' }}>{agent || 'Agent'}</Text>
              <Ionicons name="chevron-down" size={13} color={agent ? '#fff' : colors.primary} />
            </Pressable>
          ) : null}
        </ScrollView>
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
          data={conversations}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={9}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          extraData={pinned}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon={filter === 'pinned' ? 'pin-outline' : 'chatbubbles-outline'}
              title={
                search ? 'No matching chats' : filter === 'hot' ? 'No hot leads yet' : filter === 'pinned' ? 'No pinned chats' : agent ? `No chats with ${agent}` : 'No conversations yet'
              }
              message={search ? 'Try a different name or number.' : filter === 'pinned' ? 'Long-press a chat to pin it to the top.' : 'New WhatsApp chats will appear here.'}
            />
          }
          contentContainerStyle={conversations.length === 0 ? { flexGrow: 1 } : undefined}
        />
      )}

      <ActionSheet visible={agentMenu} title="Show chats of" actions={agentActions} onClose={() => setAgentMenu(false)} />
    </View>
  );
}
