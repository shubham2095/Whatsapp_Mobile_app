import { request } from './client';

// -> { bulk_sends: [{ uuid, template_name, language, status, total, sent_count, failed_count, phone_number, created_at }], meta }
export const listBulkSends = ({ page = 1, perPage = 20 } = {}) =>
  request('/whatsapp/bulk-sends', { params: { page, per_page: perPage } });

// -> { bulk_send: { ..., recipients: [{ id, phone, status, wamid, error_message, sent_at }] } }
export const getBulkSend = (id) => request(`/whatsapp/bulk-sends/${id}`);

// body: { numbers[] (max 1000), template, language, variables?[], header_media_url? or header_media_id? } -> { bulk_send }
export const sendBulk = (body) => request('/whatsapp/bulk-send', { method: 'POST', body });

// Sends the numbers that failed again, with the same template and values. -> { bulk_send } (with recipients)
export const retryBulkSend = (id) => request(`/whatsapp/bulk-sends/${id}/retry`, { method: 'POST' });

// Uploads a header image / video / PDF to WhatsApp. Only jpg, png, mp4 and pdf up to 16 MB are accepted.
// file: { uri, name, mimeType } -> { media_id }, to be passed as `header_media_id` to sendBulk.
export function uploadBulkHeader(file) {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.mimeType });
  return request('/whatsapp/bulk-send/upload-header', { method: 'POST', body: form, multipart: true });
}
