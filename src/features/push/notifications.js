import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { registerDevice, unregisterDevice } from '@/api/devices';
import { clearPushToken, getPushToken, savePushToken } from '@/lib/storage';
import { IN_EXPO_GO, Notifications } from './expoNotifications';

export const CHANNEL_ID = 'messages';

// Conversation currently open on screen: its notifications are not shown (the chat already updates).
let activeConversationId = null;
export function setActiveConversation(id) {
  activeConversationId = id;
}

Notifications?.setNotificationHandler({
  handleNotification: async (notification) => {
    const inOpenChat = notification.request.content.data?.conversation_id === activeConversationId;
    return {
      shouldShowBanner: !inOpenChat,
      shouldShowList: !inOpenChat,
      shouldPlaySound: !inOpenChat,
      shouldSetBadge: false,
    };
  },
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  // Must exist before the permission prompt / token request on Android 13+.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'WhatsApp messages',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0e7c7b',
  });
}

const unsupported = () => IN_EXPO_GO || !Notifications || !Device.isDevice;

/**
 * Current push state without prompting.
 * -> 'unsupported' (Expo Go / emulator) | 'denied' | 'undetermined' | 'granted'
 */
export async function getPushStatus() {
  if (unsupported()) return 'unsupported';
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  return status === 'denied' && !canAskAgain ? 'denied' : 'undetermined';
}

/**
 * Asks for permission if needed, gets the Expo push token and registers it with the backend.
 * Never throws. -> { status: 'registered' | 'denied' | 'unsupported' | 'error', token?, message? }
 */
export async function registerForPush() {
  if (IN_EXPO_GO || !Notifications) return { status: 'unsupported', message: 'Push notifications need a development build, not Expo Go.' };
  if (!Device.isDevice) return { status: 'unsupported', message: 'Push notifications only work on a physical device.' };

  try {
    await ensureChannel();
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return { status: 'denied', message: 'Notifications are turned off for Heltog.' };

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return { status: 'error', message: 'Missing EAS project id. Run "eas init" and rebuild.' };

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerDevice({ token, platform: Platform.OS });
    await savePushToken(token);
    return { status: 'registered', token };
  } catch (e) {
    return { status: 'error', message: e?.message || 'Could not set up notifications.' };
  }
}

// Called on sign-out, while the session token is still valid. Best effort.
export async function unregisterFromPush() {
  const token = await getPushToken();
  if (!token) return;
  try {
    await unregisterDevice(token);
  } catch {}
  await clearPushToken();
}

// Removes already-delivered notifications of one chat from the shade (called when the chat opens).
export async function dismissChatNotifications(conversationId) {
  if (!Notifications) return;
  try {
    const shown = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      shown
        .filter((n) => n.request.content.data?.conversation_id === conversationId)
        .map((n) => Notifications.dismissNotificationAsync(n.request.identifier)),
    );
  } catch {}
}
