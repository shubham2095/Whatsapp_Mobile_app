import { useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import * as inbox from '@/api/inbox';
import { listTemplates } from '@/api/templates';

// The backend has no realtime channel yet, so lists poll while their screen is focused
// (same cadence as the web app). Push notifications (Phase 3) cover the background case.
const LIST_POLL_MS = 15_000;
const CHAT_POLL_MS = 8_000;

export function useConversations({ status, search }) {
  const focused = useIsFocused();
  return useInfiniteQuery({
    queryKey: ['conversations', { status: status ?? null, search: search ?? '' }],
    queryFn: ({ pageParam }) => inbox.listConversations({ status, search, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    refetchInterval: focused ? LIST_POLL_MS : false,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useMessages(conversationId) {
  const focused = useIsFocused();
  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => inbox.listMessages(conversationId, { cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    refetchInterval: focused ? CHAT_POLL_MS : false,
    refetchOnWindowFocus: true,
  });

  // Newest first (the chat list is inverted). Polling can overlap pages, so de-dupe by id.
  const messages = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const page of query.data?.pages ?? []) {
      for (const m of page.messages) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          out.push(m);
        }
      }
    }
    return out;
  }, [query.data]);

  return { ...query, messages };
}

function prependMessage(queryClient, conversationId, message) {
  queryClient.setQueryData(['messages', conversationId], (old) => {
    if (!old) return old;
    if (old.pages.some((p) => p.messages.some((m) => m.id === message.id))) return old;
    const [first, ...rest] = old.pages;
    return { ...old, pages: [{ ...first, messages: [message, ...first.messages] }, ...rest] };
  });
}

function afterSend(queryClient, conversationId, { message }) {
  prependMessage(queryClient, conversationId, message);
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
}

export function useSendText(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => inbox.sendText(conversationId, body),
    onSuccess: (data) => afterSend(queryClient, conversationId, data),
  });
}

export function useSendTemplate(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, language }) => inbox.sendTemplate(conversationId, name, language),
    onSuccess: (data) => afterSend(queryClient, conversationId, data),
  });
}

export function useSendMedia(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => inbox.sendMedia(conversationId, payload),
    onSuccess: (data) => afterSend(queryClient, conversationId, data),
  });
}

export function useDeleteMessage(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) => inbox.deleteMessage(conversationId, messageId),
    onSuccess: (_data, messageId) => {
      queryClient.setQueryData(['messages', conversationId], (old) =>
        old && { ...old, pages: old.pages.map((p) => ({ ...p, messages: p.messages.filter((m) => m.id !== messageId) })) },
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId) => inbox.markRead(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.setQueriesData({ queryKey: ['conversations'] }, (old) =>
        old && {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            conversations: p.conversations.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
          })),
        },
      );
    },
  });
}

// Approved templates, used to re-open a conversation whose 24h window has closed.
export function useApprovedTemplates(enabled = true) {
  return useQuery({
    queryKey: ['templates', 'approved'],
    queryFn: () => listTemplates({ status: 'APPROVED', perPage: 100 }),
    enabled,
    staleTime: 5 * 60_000,
  });
}
