import { request } from './client';

// -> { contacts, meta: { current_page, last_page, total } }
// tagName needs the campaign-tags backend patch (docs/backend-campaign-tags-variables.md); older servers ignore it.
export const listContacts = ({ search, hot, blocked, optedOut, tagName, page = 1, perPage = 25 } = {}) =>
  request('/contacts', {
    params: {
      search,
      tag_name: tagName || undefined,
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

// The tags in use with how many contacts carry each: { tags: [{ name, contacts_count }] }. Needs the backend patch, 404 without it.
export const listTagNames = () => request('/contacts/tag-names');
