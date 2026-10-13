import { request } from './client';

// -> { templates, meta: { current_page, last_page, total } }
export const listTemplates = ({ status, search, category, page, perPage } = {}) =>
  request('/templates', { params: { status, search, category, page, per_page: perPage } });

// -> { template } including `components: [{ type, format, text, buttons }]`
export const getTemplate = (id) => request(`/templates/${id}`);

// Submits to Meta for approval. -> { template, message }
export const createTemplate = (body) => request('/templates', { method: 'POST', body });

export const deleteTemplate = (id) => request(`/templates/${id}`, { method: 'DELETE' });

// Pulls the latest approved/rejected templates from Meta. -> { message, synced }
export const syncTemplates = () => request('/templates/sync', { method: 'POST' });
