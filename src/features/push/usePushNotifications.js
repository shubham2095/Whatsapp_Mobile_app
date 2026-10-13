import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Notifications } from './expoNotifications';
import { registerForPush } from './notifications';

// Backend payload (WhatsAppWebhookService): title = contact name, data = { type, conversation_id }.
function openChatFrom(response, canViewInbox) {
  const { content } = response.notification.request;
  const data = content.data ?? {};
  if (!canViewInbox || data.type !== 'whatsapp_message' || typeof data.conversation_id !== 'string') return;
  // A message just arrived, so the customer's 24h window is open.
  router.push({
    pathname: '/chat/[id]',
    params: { id: data.conversation_id, name: content.title || 'Chat', phone: '', windowOpen: 'true' },
  });
}

/**
 * Mount once inside the authenticated area. Registers the phone for push, keeps the token fresh,
 * refreshes inbox data when a notification arrives, and opens the chat when one is tapped.
 * Does nothing in Expo Go (where expo-notifications cannot load).
 */
export function usePushNotifications({ canViewInbox }) {
  const queryClient = useQueryClient();
  const handled = useRef(new Set());

  useEffect(() => {
    if (!Notifications) return undefined;
    registerForPush();
    // Expo rarely rotates tokens; keep the backend in sync when it does.
    const tokenSub = Notifications.addPushTokenListener(() => {
      registerForPush();
    });
    return () => tokenSub.remove();
  }, []);

  useEffect(() => {
    if (!Notifications) return undefined;
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handled.current.add(response.notification.request.identifier);
      openChatFrom(response, canViewInbox);
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [queryClient, canViewInbox]);

  // App launched by tapping a notification while it was closed.
  useEffect(() => {
    if (!Notifications) return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (handled.current.has(id)) return;
      handled.current.add(id);
      openChatFrom(response, canViewInbox);
    });
  }, [canViewInbox]);
}
