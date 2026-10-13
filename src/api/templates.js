import { request } from './client';

// -> { templates, meta }
export const listTemplates = ({ status, search, category, perPage } = {}) =>
  request('/templates', { params: { status, search, category, per_page: perPage } });
