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

// ---- cheap updates: ask only for what changed -------------------------------------------------------------------
// A server with /whatsapp/conversations/changes lets the app keep the inbox current with tiny answers (usually 0 to 2
// chats) instead of downloading the whole list again and again. The full list then only loads once, and as a slow safety
// net. Without that endpoint everything works as before (full list, backing-off polling).
let deltaSupported = null; // null = not known yet
let deltaCursor = null; // server time up to which the cached lists are current
const DELTA_POLL = { base: 10_000, cap: 45_000, capWithPush: 90_000 };
const FULL_LIST_SAFETY_POLL_MS = 5 * 60_000;

function noteFullList(result) {
  const serverTime = result.meta?.server_time;
  if (serverTime) {
    deltaSupported = true;
    deltaCursor = serverTime;
  } else if (deltaSupported === null) {
    deltaSupported = false;
  }
}

// Puts changed chats into one cached list: updates the ones it has, drops those that no longer fit its status filter,
// and adds new ones at the top.
function mergeChanges(old, changed, status) {
  if (!old?.pages?.length) return old;
  const byId = new Map(changed.map((c) => [c.id, c]));
  const fits = (c) => !status || c.status === status;
  const pages = old.pages.map((p) => ({
    ...p,
    conversations: p.conversations.flatMap((c) => {
      const next = byId.get(c.id);
      if (!next) return [c];
      return fits(next) ? [next] : [];
    }),
  }));
  const present = new Set(pages.flatMap((p) => p.conversations.map((c) => c.id)));
  const fresh = changed.filter((c) => !present.has(c.id) && fits(c));
  if (fresh.length) pages[0] = { ...pages[0], conversations: [...fresh, ...pages[0].conversations] };
  return { ...old, pages };
}

function applyChanges(queryClient, changed) {
  for (const q of queryClient.getQueryCache().findAll({ queryKey: ['conversations'] })) {
    const filters = q.queryKey[1];
    if (!filters || filters.search) continue; // a search result cannot be patched: the next full load fixes it
    queryClient.setQueryData(q.queryKey, (old) => mergeChanges(old, changed, filters.status));
  }
}

async function fetchConversationPage({ status, search, page }) {
  const size = serverSortsByRecent === false ? BIG_PAGE : SMALL_PAGE;
  const result = await inbox.listConversations({ status, search, sort: 'recent', page, perPage: size });
  if (serverSortsByRecent === null && page === 1) {
    serverSortsByRecent = result.conversations.length < 3 || isNewestFirst(result.conversations);
    if (serverSortsByRecent === false) {
      const big = await inbox.listConversations({ status, search, sort: 'recent', page, perPage: BIG_PAGE });
      noteFullList(big);
      return big;
    }
  }
  if (page === 1) noteFullList(result);
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
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['conversations', { status: status ?? null, search: search ?? '' }],
    queryFn: ({ pageParam }) => fetchConversationPage({ status, search, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    refetchInterval: (q) => (!focused ? false : deltaSupported ? FULL_LIST_SAFETY_POLL_MS : nextPollDelay(q, INBOX_POLL)),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  // The small "what changed" question, asked while the inbox is on screen.
  const changes = useQuery({
    queryKey: ['conversations-changes'],
    queryFn: async () => {
      try {
        const res = await inbox.listConversationChanges(deltaCursor);
        if (res.server_time) deltaCursor = res.server_time;
        if (res.has_more) queryClient.invalidateQueries({ queryKey: ['conversations'] });
        else if (res.conversations.length) applyChanges(queryClient, res.conversations);
        return { changed: res.conversations.length }; // same value while nothing changes, so polling can back off
      } catch (e) {
        if (e.status === 404 || e.status === 405) deltaSupported = false; // an older server: back to the full list
        throw e;
      }
    },
    enabled: focused && !!query.data && deltaSupported === true,
    refetchInterval: (q) => (focused && deltaSupported ? nextPollDelay(q, DELTA_POLL) : false),
    retry: false,
    staleTime: 0,
  });

  useRefreshWhenFocused(deltaSupported ? changes : query);
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
