import { cacheStorage } from './cacheStorage';

// The last signed-in user (name, permissions, plan), so the app can open without internet.
// The login token is NOT stored here; it stays in the encrypted SecureStore.
const KEY = 'heltog-user';

export async function loadCachedUser() {
  try {
    const raw = await cacheStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const saveCachedUser = (user) => cacheStorage.setItem(KEY, JSON.stringify(user));
export const clearCachedUser = () => cacheStorage.removeItem(KEY);
