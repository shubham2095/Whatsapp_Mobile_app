import { request } from './client';

// -> { numbers: [{ id, phone_number_id, display_phone_number, verified_name, quality_rating,
//                  status, is_default, is_registered, waba: { id, name, waba_id, status } }] }
export const listNumbers = () => request('/whatsapp/numbers');

// body: { waba_id, phone_number_id, display_phone_number, access_token, name? }
export const connectManual = (body) => request('/whatsapp/connect-manual', { method: 'POST', body });

export const syncNumber = (id) => request(`/whatsapp/numbers/${id}/sync`, { method: 'POST' });

// PIN: the 6-digit two-step-verification code that registers the number on the Cloud API.
export const registerNumber = (id, pin) => request(`/whatsapp/numbers/${id}/register`, { method: 'POST', body: { pin } });

// Fixes Meta error #200 ("no permission to send").
export const subscribeApp = (id) => request(`/whatsapp/numbers/${id}/subscribe-app`, { method: 'POST' });

// -> { wamid, to }
export const sendTest = (id, { to, template, language }) =>
  request(`/whatsapp/numbers/${id}/send-test`, { method: 'POST', body: { to, type: 'template', template, language } });

export const updateToken = (id, accessToken) =>
  request(`/whatsapp/numbers/${id}/token`, { method: 'PUT', body: { access_token: accessToken } });

export const disconnectNumber = (id) => request(`/whatsapp/numbers/${id}`, { method: 'DELETE' });
