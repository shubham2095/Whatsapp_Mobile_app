import { request } from './client';

// -> { bulk_sends: [{ uuid, template_name, language, status, total, sent_count, failed_count, phone_number, created_at }], meta }
export const listBulkSends = ({ page = 1, perPage = 20 } = {}) =>
  request('/whatsapp/bulk-sends', { params: { page, per_page: perPage } });

// -> { bulk_send: { ..., recipients: [{ id, phone, status, wamid, error_message, sent_at }] } }
export const getBulkSend = (id) => request(`/whatsapp/bulk-sends/${id}`);

// body: { numbers[] (max 1000), template, language, variables?[], header_media_url? } -> { bulk_send }
export const sendBulk = (body) => request('/whatsapp/bulk-send', { method: 'POST', body });
