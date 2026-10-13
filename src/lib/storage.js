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

export const getToken = () => read(TOKEN_KEY);
export const saveToken = (token) => SecureStore.setItemAsync(TOKEN_KEY, token);
export const clearToken = () => remove(TOKEN_KEY);

// The Expo push token this phone registered with the backend (needed to unregister on logout).
export const getPushToken = () => read(PUSH_TOKEN_KEY);
export const savePushToken = (token) => SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
export const clearPushToken = () => remove(PUSH_TOKEN_KEY);
