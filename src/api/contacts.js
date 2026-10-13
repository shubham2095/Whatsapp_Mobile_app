import { request } from './client';

// -> { contacts, meta: { current_page, last_page, total } }
export const listContacts = ({ search, hot, blocked, optedOut, page = 1, perPage = 25 } = {}) =>
  request('/contacts', {
    params: {
      search,
      hot: hot ? 1 : undefined,
      blocked: blocked ? 1 : undefined,
      opted_out: optedOut ? 1 : undefined,
      page,
      per_page: perPage,
    },
  });

// -> { contact }
export const getContact = (id) => request(`/contacts/${id}`);

// body: { phone, name?, email?, company?, tag_list? }
export const createContact = (body) => request('/contacts', { method: 'POST', body });

// body: any of name, email, company, tag_list, is_blocked, opted_out (null/empty fields are ignored by the backend)
export const updateContact = (id, body) => request(`/contacts/${id}`, { method: 'PUT', body });

export const deleteContact = (id) => request(`/contacts/${id}`, { method: 'DELETE' });

// Up to 5000 rows per call. -> { created, updated, skipped, total }
export const importContacts = (contacts) => request('/contacts/import', { method: 'POST', body: { contacts } });
