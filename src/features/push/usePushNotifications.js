import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
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
 */
export function usePushNotifications({ canViewInbox }) {
  const queryClient = useQueryClient();
  const handled = useRef(new Set());

  useEffect(() => {
    registerForPush();
    // Expo rarely rotates tokens; keep the backend in sync when it does.
    let tokenSub;
    try {
      tokenSub = Notifications.addPushTokenListener(() => {
        registerForPush();
      });
    } catch {
      // Not available in Expo Go on Android; registerForPush reports "unsupported" there.
    }
    return () => tokenSub?.remove();
  }, []);

  useEffect(() => {
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
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    if (handled.current.has(id)) return;
    handled.current.add(id);
    openChatFrom(lastResponse, canViewInbox);
  }, [lastResponse, canViewInbox]);
}
