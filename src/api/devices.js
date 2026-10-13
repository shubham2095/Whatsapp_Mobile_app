import { request } from './client';

// Register / refresh this phone's push token. The backend upserts by token.
export const registerDevice = ({ token, platform, provider = 'expo' }) =>
  request('/devices', { method: 'POST', body: { token, provider, platform } });

export const unregisterDevice = (token) => request('/devices', { method: 'DELETE', body: { token } });

// -> { devices: [{ uuid, platform, provider, last_used_at }] }
export const listDevices = () => request('/devices');
