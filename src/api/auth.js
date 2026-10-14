import { request } from './client';

// Public endpoints pass `token: null` so a stale stored token is never sent
// (and a 401 from them never triggers the global sign-out handler).
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password }, token: null });

export const register = (body) => request('/auth/register', { method: 'POST', body, token: null });

export const forgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: { email }, token: null });

export const resetPassword = (body) => request('/auth/reset-password', { method: 'POST', body, token: null });

export const me = () => request('/auth/me');

export const refresh = () => request('/auth/refresh', { method: 'POST' });

export const logout = () => request('/auth/logout', { method: 'POST' });

export const updateProfile = (body) => request('/auth/profile', { method: 'PUT', body });

// The backend validates `password` + `password_confirmation` (the PDF's `new_password` is outdated).
export const changePassword = (body) => request('/auth/change-password', { method: 'POST', body });

// Permanently deletes the signed-in account. Needs the backend endpoint described in
// docs/backend-account-deletion.md. `deleteCompany` must be true for a company owner, because
// deleting an owner removes the whole workspace.
// A 404/405 answer means the server does not have the endpoint yet.
export const deleteAccount = ({ password, deleteCompany = false }) =>
  request('/auth/delete-account', { method: 'POST', body: { password, delete_company: deleteCompany } });
