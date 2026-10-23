import { request } from './client';

// GET /whatsapp/conversations -> { conversations, meta: { current_page, last_page, total } }
// sort: 'recent' asks for newest message first. Servers without that option ignore it and list hot contacts first.
export const listConversations = ({ status, search, sort, page = 1, perPage = 25 } = {}) =>
  request('/whatsapp/conversations', { params: { status, search, sort, page, per_page: perPage } });

// Only the chats that changed after `since` (the server_time of the last answer; leave it out to just get the clock).
// -> { conversations, has_more, server_time }. 404 on servers without the "changes" endpoint.
export const listConversationChanges = (since) => request('/whatsapp/conversations/changes', { params: { since } });

// Newest first. `cursor` is the opaque `next_cursor` from the previous page.
// -> { messages, next_cursor, has_more }
export const listMessages = (conversationId, { cursor, perPage = 30 } = {}) =>
  request(`/whatsapp/conversations/${conversationId}/messages`, { params: { cursor, per_page: perPage } });

export const markRead = (conversationId) =>
  request(`/whatsapp/conversations/${conversationId}/mark-read`, { method: 'POST' });

// -> { message }
export const sendText = (conversationId, body) =>
  request(`/whatsapp/conversations/${conversationId}/send`, { method: 'POST', body: { type: 'text', body } });

// Re-opens a closed 24h window.
export const sendTemplate = (conversationId, template, language) =>
  request(`/whatsapp/conversations/${conversationId}/send`, {
    method: 'POST',
    body: { type: 'template', template, language },
  });

// file: { uri, name, mimeType }; mediaType: image | video | audio | document
export function sendMedia(conversationId, { file, mediaType, caption }) {
  const form = new FormData();
  form.append('media_type', mediaType);
  if (caption) form.append('caption', caption);
  form.append('file', { uri: file.uri, name: file.name, type: file.mimeType });
  return request(`/whatsapp/conversations/${conversationId}/send-media`, { method: 'POST', body: form, multipart: true });
}

export const deleteMessage = (conversationId, messageId) =>
  request(`/whatsapp/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE' });
