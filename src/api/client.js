import { API_URL } from '@/config';
import { getToken } from '@/lib/storage';

// Thrown for every failed call. `status` is the HTTP status (0 = network error),
// `code` is the backend's machine code (e.g. "plan_required"), `errors` holds
// per-field validation messages (422).
export class ApiError extends Error {
  constructor(message, { status = 0, code = null, errors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

let onUnauthorized = null;
// The auth layer registers a handler that clears the session and routes to login.
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function toQuery(params) {
  if (!params) return '';
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

/**
 * request('/auth/me')
 * request('/contacts', { params: { page: 2 } })
 * request('/auth/login', { method: 'POST', body: { email, password } })
 * request('/whatsapp/conversations/1/send-media', { method: 'POST', body: formData, multipart: true })
 * Resolves with `data` from the response envelope.
 */
export async function request(path, { method = 'GET', body, params, multipart = false, token } = {}) {
  const authToken = token === undefined ? await getToken() : token;
  const headers = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let payload;
  if (body !== undefined) {
    if (multipart) {
      payload = body; // FormData — let fetch set the boundary
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(API_URL + path + toQuery(params), { method, headers, body: payload });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.');
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();

  if (!res.ok || json.success === false) {
    throw new ApiError(json.message || `Request failed (${res.status})`, {
      status: res.status,
      code: json.code ?? null,
      errors: json.errors ?? null,
    });
  }
  return json.data;
}
