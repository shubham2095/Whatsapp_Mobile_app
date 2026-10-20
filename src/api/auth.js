import { request } from './client';

// Public endpoints pass `token: null` so a stale stored token is never sent
// (and a 401 from them never triggers the global sign-out handler).
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password }, token: null });

export const register = (body) => request('/auth/register', { method: 'POST', body, token: null });

export const forgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: { email }, token: null });

export const resetPassword = (body) => request('/auth/reset-password', { method: 'POST', body, token: null });

// gate: false = do not wait for the start-up session check, because these calls ARE that check (see client.js).
export const me = () => request('/auth/me', { gate: false });

export const refresh = () => request('/auth/refresh', { method: 'POST', gate: false });

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

// Sign in with the mobile number saved on the account. The server always answers "sent" (it never says whether the
// number exists) and waits 30 seconds before it sends another code.
export const requestOtp = (phone) => request('/auth/otp/request', { method: 'POST', body: { phone }, token: null });

// code: the 6 digits. Same answer as login: { user, token, ... }. A wrong or expired code is a 422, never a 401.
export const verifyOtp = (phone, code) => request('/auth/otp/verify', { method: 'POST', body: { phone, code }, token: null });

// Last step of "Continue with Google" in the app: the one-time code from the redirect plus the secret the app kept.
// Same answer as login: { user, token, ... }. Needs the GoogleAuthController backend file (docs/backend-google-signin.md).
export const exchangeGoogleCode = (code, verifier) =>
  request('/auth/google/exchange', { method: 'POST', body: { code, verifier }, token: null });
