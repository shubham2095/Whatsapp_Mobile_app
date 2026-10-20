import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'heltog_token';
const PUSH_TOKEN_KEY = 'heltog_push_token';

async function read(key) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function remove(key) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
}

// The token is read from the secure store once and then kept in memory: every API call asks for it, and each read
// would otherwise be a slow call into the phone's keystore. undefined = not read yet, null = signed out.
let tokenInMemory;
export async function getToken() {
  if (tokenInMemory === undefined) tokenInMemory = await read(TOKEN_KEY);
  return tokenInMemory;
}
export async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  tokenInMemory = token;
}
export async function clearToken() {
  tokenInMemory = null;
  await remove(TOKEN_KEY);
}

// The Expo push token this phone registered with the backend (needed to unregister on logout).
export const getPushToken = () => read(PUSH_TOKEN_KEY);
export const savePushToken = (token) => SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
export const clearPushToken = () => remove(PUSH_TOKEN_KEY);

// Chats the user pinned in the inbox, kept per user on this phone (a small JSON list of conversation ids).
export async function getPinnedChats(userId) {
  const raw = await read(`heltog_pinned_${userId}`);
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function savePinnedChats(userId, ids) {
  try {
    await SecureStore.setItemAsync(`heltog_pinned_${userId}`, JSON.stringify(ids));
  } catch {}
}

// Light / dark / follow-the-phone choice for the app's appearance.
const THEME_KEY = 'heltog_theme';

export async function getThemePreference() {
  const saved = await read(THEME_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

export async function saveThemePreference(preference) {
  try {
    await SecureStore.setItemAsync(THEME_KEY, preference);
  } catch {}
}

// The welcome slides are shown once per phone, after the first sign-in.
export async function getOnboardingSeen() {
  return (await read('heltog_onboarding_seen')) === '1';
}
export const saveOnboardingSeen = () => SecureStore.setItemAsync('heltog_onboarding_seen', '1');
