import { request } from './client';

// -> { campaigns, meta: { current_page, last_page, total } }
export const listCampaigns = ({ search, status, page = 1, perPage = 20 } = {}) =>
  request('/campaigns', { params: { search, status, page, per_page: perPage } });

// -> { campaign, campaign_contacts: [{ id, status, contact: { id, name, phone } | null }], meta }
// `page` pages through the recipients.
export const getCampaign = (id, { page = 1 } = {}) => request(`/campaigns/${id}`, { params: { page } });

// body: { name, template_id, audience_filter?: { source }, scheduled_at? (ISO, must be in the future) }
// (audience_filter.tags and variable_mapping are accepted by the server but do nothing useful, see campaign-form.js)
export const createCampaign = (body) => request('/campaigns', { method: 'POST', body });

export const startCampaign = (id) => request(`/campaigns/${id}/start`, { method: 'POST' });
export const pauseCampaign = (id) => request(`/campaigns/${id}/pause`, { method: 'POST' });
export const cancelCampaign = (id) => request(`/campaigns/${id}/cancel`, { method: 'POST' });

// Draft campaigns only.
export const deleteCampaign = (id) => request(`/campaigns/${id}`, { method: 'DELETE' });
