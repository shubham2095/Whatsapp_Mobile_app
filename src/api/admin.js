import { request } from './client';

// All of these need a super admin; the backend answers 403 otherwise.

// -> { companies: [{ id, name, status, users_count, owner_name, owner_email, plan_id, plan_name,
//                    agents_used, agents_limit (null = unlimited), trial_ends_at, created_at }],
//      plans: [{ id, name }] }   (plans = active plans, for the assign-plan picker)
export const listCompanies = () => request('/admin/companies');

// body: { company_name, owner_name, owner_email, password (8+), phone?, plan_id? } -> { company }
export const createCompany = (body) => request('/admin/companies', { method: 'POST', body });

// Suspends or reactivates. -> { message, status }
export const toggleCompany = (id) => request(`/admin/companies/${id}/toggle`, { method: 'POST' });

export const assignPlan = ({ id, planId }) => request(`/admin/companies/${id}/plan`, { method: 'POST', body: { plan_id: planId } });

export const deleteCompany = (id) => request(`/admin/companies/${id}`, { method: 'DELETE' });

// -> { users: [{ id, name, email, status, role: 'Admin' | 'Agent' }] }
export const companyUsers = (id) => request(`/admin/companies/${id}/users`);

export const resetUserPassword = ({ companyId, userId, password }) =>
  request(`/admin/companies/${companyId}/users/${userId}/reset-password`, { method: 'POST', body: { password } });

// -> { plans: [{ id, name, slug, description, billing_period, price, currency, limits: {key: n (-1 = unlimited)},
//                features: {key: bool}, is_active, is_public, sort_order, subscribers }], limit_keys, feature_keys }
export const listAdminPlans = () => request('/admin/plans');

// body: { name, description?, billing_period: monthly|yearly, price, currency?, limits: {key: n | ''}, features: {key: bool},
//         is_active?, is_public?, sort_order? } -> { plan }
export const createPlan = (body) => request('/admin/plans', { method: 'POST', body });

// Replaces limits and features completely, so always send the full maps. -> { plan }
export const updatePlan = ({ id, ...body }) => request(`/admin/plans/${id}`, { method: 'PUT', body });

export const togglePlan = (id) => request(`/admin/plans/${id}/toggle`, { method: 'POST' });

// Fails (422) while any company is subscribed.
export const deletePlan = (id) => request(`/admin/plans/${id}`, { method: 'DELETE' });

// Seller details printed on every invoice.
// -> { settings: { company_name, address, gstin, email, phone, tax_details, invoice_prefix, gst_rate } }
export const getSettings = () => request('/admin/settings');
export const updateSettings = (body) => request('/admin/settings', { method: 'PUT', body });
