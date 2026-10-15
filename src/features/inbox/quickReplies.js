import { useEffect, useSyncExternalStore } from 'react';
import { cacheStorage } from '@/lib/cacheStorage';

// Saved replies live on this phone, one list per signed-in user, and work with no backend support.
// Text can contain {name} (the customer's first name) and {agent} (your name).
const SEED = [
  { id: 'seed-1', title: 'Greeting', text: 'Hi {name}, thanks for contacting us! How can I help you today?' },
  { id: 'seed-2', title: 'Please wait', text: 'Thanks {name}, give me a moment while I check this for you.' },
  { id: 'seed-3', title: 'Closing', text: 'Happy to help, {name}. Message us anytime if you need anything else. - {agent}' },
];

const store = { userId: null, replies: [], loaded: false };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const keyFor = (userId) => `heltog-quick-replies-${userId}`;

// useSyncExternalStore needs a stable snapshot between changes, so it is replaced, never mutated.
let snapshot = { replies: store.replies, loaded: store.loaded };
const publish = () => {
  snapshot = { replies: store.replies, loaded: store.loaded };
  emit();
};

async function load(userId) {
  if (store.userId === userId && store.loaded) return;
  store.userId = userId;
  store.loaded = false;
  store.replies = [];
  publish();
  let replies = null;
  try {
    const raw = await cacheStorage.getItem(keyFor(userId));
    replies = raw ? JSON.parse(raw) : null;
  } catch {
    replies = null;
  }
  // First time on this phone: start with a few examples that can be edited or deleted.
  if (store.userId === userId) {
    store.replies = Array.isArray(replies) ? replies : SEED;
    store.loaded = true;
    publish();
  }
}

function persist() {
  cacheStorage.setItem(keyFor(store.userId), JSON.stringify(store.replies));
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useQuickReplies(userId) {
  useEffect(() => {
    load(userId);
  }, [userId]);
  const { replies, loaded } = useSyncExternalStore(subscribe, () => snapshot);

  return {
    replies,
    loaded,
    save: ({ id, title, text }) => {
      const clean = { title: title.trim(), text: text.trim() };
      store.replies = id
        ? store.replies.map((r) => (r.id === id ? { ...r, ...clean } : r))
        : [...store.replies, { id: `r-${Date.now()}`, ...clean }];
      persist();
      publish();
    },
    remove: (id) => {
      store.replies = store.replies.filter((r) => r.id !== id);
      persist();
      publish();
    },
  };
}

// "Hi {name}" -> "Hi Rahul". A missing name falls back to "there".
export function fillReply(text, { name, agent }) {
  const first = String(name ?? '').trim().split(/\s+/)[0];
  const looksLikeNumber = /^[+\d\s()-]+$/.test(first);
  return text.replaceAll('{name}', first && !looksLikeNumber ? first : 'there').replaceAll('{agent}', agent || 'the team');
}
