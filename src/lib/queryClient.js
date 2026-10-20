import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { cacheStorage } from './cacheStorage';

const DAY_MS = 24 * 60 * 60 * 1000;

// Cached data is kept for a day so the app can show the last known lists when there is no signal.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, gcTime: DAY_MS, refetchOnWindowFocus: false },
  },
});

export const persister = createAsyncStoragePersister({
  storage: cacheStorage,
  key: 'heltog-query-cache',
  throttleTime: 2000,
});

// Only read-only lists are saved to the phone. Anything about payments, secrets or one-off
// actions is never written to disk.
const PERSISTED = new Set(['conversations', 'messages', 'contacts', 'contact', 'analytics', 'campaigns', 'bulk', 'templates', 'wa-numbers', 'team', 'agents']);

export const persistOptions = {
  persister,
  maxAge: DAY_MS,
  // Bump this when the shape of cached data changes, so old caches are discarded.
  buster: 'v3',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.state.status === 'success' && PERSISTED.has(query.queryKey[0]),
  },
};

// Called on sign-out: nothing from one account may be shown to the next.
export async function clearPersistedCache() {
  queryClient.clear();
  await persister.removeClient();
}
