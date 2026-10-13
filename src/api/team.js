import { request } from './client';

// -> { members: [{ id, name, email, status ('active'|'suspended'), role ('admin'|'agent'), role_label,
//                  features: ['inbox', ...], last_login_at, created_at }],
//      roles: [{ value, label }], features: [{ key, label }] }
export const listTeam = () => request('/team');

// body: { name, email, password (8+), role: 'agent', features: ['inbox', 'contacts', ...] } -> { member }
export const createMember = (body) => request('/team', { method: 'POST', body });

// body: any of { name, password, role, features }. Never send `role` for an Admin: the backend only
// accepts 'agent', so it would demote them. -> { member }
export const updateMember = (id, body) => request(`/team/${id}`, { method: 'PUT', body });

// Flips active <-> suspended. -> { member }
export const toggleMember = (id) => request(`/team/${id}/toggle`, { method: 'POST' });

export const removeMember = (id) => request(`/team/${id}`, { method: 'DELETE' });
