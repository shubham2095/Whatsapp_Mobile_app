import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ActionSheet, Banner, EmptyState, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { Composer } from '@/features/inbox/Composer';
import { ImageViewer } from '@/features/inbox/ImageViewer';
import { MessageBubble } from '@/features/inbox/MessageBubble';
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
  const markRead = useMarkRead();
  const deleteMessage = useDeleteMessage(id);

  const now = useNow();
  const [viewerUri, setViewerUri] = useState(null);
  const [selected, setSelected] = useState(null);

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

  const canReply = can(user, 'conversations.reply');
  const canDelete = can(user, 'whatsapp.manage');

  const actions = [];
  if (selected?.body) {
    actions.push({ label: 'Copy text', icon: 'copy-outline', onPress: () => Clipboard.setStringAsync(selected.body) });
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
            onPress: () => deleteMessage.mutate(selected.id, { onError: (e) => Alert.alert('Could not delete', e.message) }),
          },
        ]),
    });
  }

  const renderItem = useCallback(
    ({ item, index }) => {
      // Inverted list: the next index is the OLDER message, so a day chip goes above the first of each day.
      const older = messages[index + 1];
      const startsDay = !older || !isSameDay(item.created_at, older.created_at);
      return (
        <View>
          {startsDay ? <DayChip iso={item.created_at} /> : null}
          <MessageBubble message={item} onLongPress={setSelected} onOpenImage={setViewerUri} />
        </View>
      );
    },
    [messages],
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding">
      <Stack.Screen options={{ headerTitle: () => <HeaderTitle name={name} phone={phone} /> }} />

      {isError && messages.length === 0 ? (
        <View style={{ flex: 1, padding: spacing.lg }}>
          <Banner message={error.message} />
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          inverted
          data={messages}
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
        <Composer conversationId={id} windowOpen={windowOpen} />
      ) : (
        <View style={{ padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text variant="small" muted style={{ textAlign: 'center' }}>You do not have permission to reply in this inbox.</Text>
        </View>
      )}

      <ImageViewer uri={viewerUri} onClose={() => setViewerUri(null)} />
      <ActionSheet visible={!!selected && actions.length > 0} actions={actions} onClose={() => setSelected(null)} />
    </KeyboardAvoidingView>
  );
}
