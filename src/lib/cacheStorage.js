import { File, Paths } from 'expo-file-system';

// A tiny async key/value store on top of the app's private document folder. React Query's persister
// uses it to keep the last lists (chats, contacts, ...) so the app has something to show offline.
const fileFor = (key) => new File(Paths.document, `${String(key).replace(/[^\w.-]/g, '_')}.json`);

export const cacheStorage = {
  async getItem(key) {
    try {
      const file = fileFor(key);
      return file.exists ? await file.text() : null;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      const file = fileFor(key);
      file.create({ overwrite: true, intermediates: true });
      file.write(value);
    } catch {
      // A full disk or a locked file must never break the app; the cache is only a convenience.
    }
  },
  async removeItem(key) {
    try {
      const file = fileFor(key);
      if (file.exists) file.delete();
    } catch {}
  },
};
