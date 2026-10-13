import { request } from './client';

// Company users see their own tickets; a super admin (`admin: true`) sees every company's.
// -> { tickets: [{ id, ticket_id, subject, description, priority, status, category, admin_reply,
//                  replied_at, resolved_at, user_name, user_email, created_at, tenant_name? }], meta }
export const listTickets = ({ admin = false, status, search, page = 1, perPage = 20 } = {}) =>
  request(admin ? '/support/admin/all' : '/support', { params: { status, search, page, per_page: perPage } });

// -> { ticket }
export const getTicket = (id) => request(`/support/${id}`);

// body: { subject, description, priority?: low|medium|high|urgent, category?: billing|technical|account|other }
export const createTicket = (body) => request('/support', { method: 'POST', body });

// Super admin only. body: { admin_reply, status?: open|in_progress|resolved|closed }
export const replyToTicket = (id, body) => request(`/support/${id}/reply`, { method: 'PUT', body });
