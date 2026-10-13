import { request } from './client';

// -> { entries, meta }
export const listBlacklist = ({ search, page = 1, perPage = 50 } = {}) =>
  request('/blacklist', { params: { search, page, per_page: perPage } });

// -> { entry }
export const addToBlacklist = ({ phone, name, reason }) => request('/blacklist', { method: 'POST', body: { phone, name, reason } });

export const removeFromBlacklist = (id) => request(`/blacklist/${id}`, { method: 'DELETE' });
