import { useCallback, useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useIsFocused } from 'expo-router';
import * as inbox from '@/api/inbox';
import { listTemplates } from '@/api/templates';
import { nextPollDelay } from '@/lib/polling';

// The backend has no realtime channel yet, so lists poll while their screen is focused
// (same cadence as the web app). Push notifications (Phase 3) cover the background case.
// Polling backs off while nothing changes and when the server is busy (see lib/polling.js); push notifications refresh
// the lists at once, so with push working the safety-net polling can be much slower.
const INBOX_POLL = { base: 15_000, cap: 60_000, capWithPush: 120_000 };
const CHAT_POLL = { base: 8_000, cap: 30_000, capWithPush: 60_000 };
// The inbox wants the newest chat first. A server with the "sort=recent" option sends exactly that, so small pages are
// enough and the first screen is quick. An older server lists hot contacts first and ignores the option, so a new chat
// from an ordinary customer could sit on a later page: then the app asks for big pages instead. It finds out from the
// first answer (is it in newest-first order?) and remembers for the rest of the session.
const SMALL_PAGE = 30;
const BIG_PAGE = 100;
let serverSortsByRecent = null; // null = not known yet

const latestOf = (c) => (c.last_message_at ? Date.parse(c.last_message_at) || 0 : 0);
const isNewestFirst = (list) => list.every((c, i) => i === 0 || latestOf(list[i - 1]) >= latestOf(c));

async function fetchConversationPage({ status, search, page }) {
  const size = serverSortsByRecent === false ? BIG_PAGE : SMALL_PAGE;
  const result = await inbox.listConversations({ status, search, sort: 'recent', page, perPage: size });
  if (serverSortsByRecent === null && page === 1) {
    serverSortsByRecent = result.conversations.length < 3 || isNewestFirst(result.conversations);
    if (serverSortsByRecent === false) return inbox.listConversations({ status, search, sort: 'recent', page, perPage: BIG_PAGE });
  }
  return result;
}

// Coming back to a screen shows what it has at once and, if that is older than a few seconds, refreshes it right away
// (polling may have slowed down while the screen was away).
function useRefreshWhenFocused({ dataUpdatedAt, refetch }, olderThanMs = 10_000) {
  useFocusEffect(
    useCallback(() => {
      if (dataUpdatedAt && Date.now() - dataUpdatedAt > olderThanMs) refetch();
    }, [dataUpdatedAt, refetch, olderThanMs]),
  );
}

export function useConversations({ status, search }) {
  const focused = useIsFocused();
  const query = useInfiniteQuery({
    queryKey: ['conversations', { status: status ?? null, search: search ?? '' }],
    queryFn: ({ pageParam }) => fetchConversationPage({ status, search, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    refetchInterval: (query) => (focused ? nextPollDelay(query, INBOX_POLL) : false),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
  useRefreshWhenFocused(query);
  return query;
}

export function useMessages(conversationId) {
  const focused = useIsFocused();
  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => inbox.listMessages(conversationId, { cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    refetchInterval: (query) => (focused ? nextPollDelay(query, CHAT_POLL) : false),
    refetchOnWindowFocus: true,
  });
  useRefreshWhenFocused(query, 6_000);

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
