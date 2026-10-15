import { request } from './client';

// GET /whatsapp/conversations -> { conversations, meta: { current_page, last_page, total } }
export const listConversations = ({ status, search, page = 1, perPage = 25 } = {}) =>
  request('/whatsapp/conversations', { params: { status, search, page, per_page: perPage } });

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

// Chat status and internal notes. These need the backend-notes-status patch (docs/patches); without it the
// server answers 404/405 and the app hides the controls.
// -> { conversation }
export const getConversation = (conversationId) => request(`/whatsapp/conversations/${conversationId}`);

// status: open | pending | resolved | closed -> { conversation }
export const setConversationStatus = (conversationId, status) =>
  request(`/whatsapp/conversations/${conversationId}/status`, { method: 'PUT', body: { status } });

// -> { notes: [{ id, body, created_at, author: { id, name } }] } newest first
export const listNotes = (conversationId) => request(`/whatsapp/conversations/${conversationId}/notes`);

// -> { note }
export const addNote = (conversationId, body) =>
  request(`/whatsapp/conversations/${conversationId}/notes`, { method: 'POST', body: { body } });

export const deleteNote = (conversationId, noteId) =>
  request(`/whatsapp/conversations/${conversationId}/notes/${noteId}`, { method: 'DELETE' });
