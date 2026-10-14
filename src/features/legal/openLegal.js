import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

// Opens a web page inside the app (Chrome Custom Tab); falls back to the phone's browser.
export async function openWeb(url) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url).catch(() => {});
  }
}
