import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ActionSheet, Banner, ChatSkeleton, EmptyState, Text } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useUser } from '@/features/auth/AuthProvider';
import { Composer } from '@/features/inbox/Composer';
import { dismissChatNotifications, setActiveConversation } from '@/features/push/notifications';
import { ImageViewer } from '@/features/inbox/ImageViewer';
import { TransferSheet } from '@/features/inbox/TransferSheet';
import { MessageBubble } from '@/features/inbox/MessageBubble';
import { MessageInfoSheet } from '@/features/inbox/MessageInfoSheet';
import { useOutbox } from '@/features/inbox/useOutbox';
import { useDeleteMessage, useMarkRead, useMessages } from '@/features/inbox/hooks';
import { formatDayLabel, isSameDay } from '@/lib/format';
import { can } from '@/lib/permissions';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';

const WINDOW_MS = 24 * 60 * 60 * 1000;

function HeaderTitle({ name, phone }) {
  return (
    <View>
      <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{name}</Text>
      {phone && phone !== name ? <Text numberOfLines={1} variant="caption" style={{ color: '#ffffffcc' }}>{phone}</Text> : null}
    </View>
  );
}

function TransferButton({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel="Transfer chat">
      <Ionicons name="swap-horizontal" size={24} color="#fff" />
    </Pressable>
  );
}

function DayChip({ iso }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
      <View style={{ backgroundColor: colors.chipBg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 }}>
        <Text variant="caption" color={colors.primary} style={{ fontWeight: '600' }}>{formatDayLabel(iso)}</Text>
      </View>
    </View>
  );
}

export default function Chat() {
  const { id, name, phone, windowOpen: windowParam } = useLocalSearchParams();
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { messages, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(id);
  const toast = useToast();
  const markRead = useMarkRead();
  const deleteMessage = useDeleteMessage(id);
  const outbox = useOutbox(id);

  const now = useNow();
  const [viewerUri, setViewerUri] = useState(null);
  const [selected, setSelected] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [infoFor, setInfoFor] = useState(null);

  // Suppress banners for this chat while it is on screen and clear any already in the shade.
  useEffect(() => {
    if (!id) return undefined;
    setActiveConversation(id);
    dismissChatNotifications(id);
    return () => setActiveConversation(null);
  }, [id]);

  // Opening the chat (and any new inbound message while it is open) marks it read.
  const latestInboundId = messages.find((m) => m.direction === 'inbound')?.id;
  const markedFor = useRef(null);
  useEffect(() => {
    if (!id) return;
    const key = `${id}:${latestInboundId ?? ''}`;
    if (markedFor.current === key) return;
    markedFor.current = key;
    markRead.mutate(id);
  }, [id, latestInboundId, markRead]);

  // The list told us the window state when it was opened; a customer reply since then re-opens it.
  const latestInbound = messages.find((m) => m.direction === 'inbound');
  const repliedRecently = latestInbound ? now - new Date(latestInbound.created_at).getTime() < WINDOW_MS : false;
  const windowOpen = windowParam === 'true' || repliedRecently;
  // Customers can be answered freely for 24 hours after their last message.
  const windowEndsAt = latestInbound ? new Date(latestInbound.created_at).getTime() + WINDOW_MS : null;

  // Messages still being sent come first (newest first, like the chat list).
  const listData = useMemo(() => [...outbox.items, ...messages], [outbox.items, messages]);

  const canReply = can(user, 'conversations.reply');
  const canDelete = can(user, 'whatsapp.manage');

  const actions = [];
  if (selected?._local) {
    const target = selected;
    actions.push({ label: 'Send again', icon: 'refresh-outline', onPress: () => outbox.retry(target.id) });
    actions.push({ label: 'Discard', icon: 'trash-outline', danger: true, onPress: () => outbox.discard(target.id) });
  } else if (selected) {
    const target = selected;
    actions.push({ label: 'Message info', icon: 'information-circle-outline', onPress: () => setInfoFor(target) });
  }
  if (selected?.body) {
    actions.push({ label: 'Copy text', icon: 'copy-outline', onPress: () => { Clipboard.setStringAsync(selected.body); toast.show('Copied'); } });
  }
  if (selected && canDelete) {
    actions.push({
      label: 'Delete message',
      icon: 'trash-outline',
      danger: true,
      onPress: () =>
        Alert.alert('Delete message', 'This removes the message from Heltog. It stays on the customer\'s phone.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteMessage.mutate(selected.id, { onSuccess: () => toast.show('Message deleted'), onError: (e) => Alert.alert('Could not delete', e.message) }),
          },
        ]),
    });
  }

  // A message that is still sending has nothing to offer; a failed one can be sent again.
  const pickMessage = useCallback((m) => {
    if (!(m._local && m.status === 'sending')) setSelected(m);
  }, []);
  const pickFailed = useCallback((m) => {
    if (m._local && m.status === 'failed') setSelected(m);
  }, []);

  const renderItem = useCallback(
    ({ item, index }) => {
      // Inverted list: the next index is the OLDER message, so a day chip goes above the first of each day.
      const older = listData[index + 1];
      const startsDay = !older || !isSameDay(item.created_at, older.created_at);
      return (
        <View>
          {startsDay ? <DayChip iso={item.created_at} /> : null}
          <MessageBubble message={item} onPress={pickFailed} onLongPress={pickMessage} onOpenImage={setViewerUri} />
        </View>
      );
    },
    [listData, pickFailed, pickMessage],
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding">
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderTitle name={name} phone={phone} />,
          headerRight: () => <TransferButton onPress={() => setTransferOpen(true)} />,
        }}
      />

      {isError && messages.length === 0 ? (
        <View style={{ flex: 1, padding: spacing.lg }}>
          <Banner message={error.message} />
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <ChatSkeleton />
      ) : (
        <FlatList
          inverted
          data={listData}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: spacing.sm, flexGrow: 1 }}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.md }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <View style={{ flex: 1, transform: [{ scaleY: -1 }] }}>
              <EmptyState icon="chatbubble-ellipses-outline" title="No messages yet" message="Say hello to start the conversation." />
            </View>
          }
        />
      )}

      {canReply ? (
        <Composer conversationId={id} windowOpen={windowOpen} windowEndsAt={windowEndsAt} onSendText={outbox.send} userId={user.id} contactName={name} agentName={user.name} />
      ) : (
        <View style={{ padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text variant="small" muted style={{ textAlign: 'center' }}>You do not have permission to reply in this inbox.</Text>
        </View>
      )}

      <ImageViewer uri={viewerUri} onClose={() => setViewerUri(null)} />
      <MessageInfoSheet message={infoFor} onClose={() => setInfoFor(null)} />
      <TransferSheet visible={transferOpen} conversationId={id} onClose={() => setTransferOpen(false)} />
      <ActionSheet visible={!!selected && actions.length > 0} actions={actions} onClose={() => setSelected(null)} />
    </KeyboardAvoidingView>
  );
}
