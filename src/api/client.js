import { onlineManager } from '@tanstack/react-query';
import { API_URL } from '@/config';
import { reportServerFailure, reportServerOk } from '@/lib/polling';
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

// While the app checks the saved session in the background at start-up (a token refresh), other calls wait for it:
// a refreshed token makes the old one invalid, so a call sent in the middle would be rejected and sign the user out.
let gate = null;
export function holdRequestsUntil(promise) {
  const mine = promise.catch(() => {});
  gate = mine;
  mine.then(() => {
    if (gate === mine) gate = null;
  });
}

// A call that gets no answer should fail with a clear message instead of leaving the screen spinning for minutes.
const TIMEOUT_MS = { read: 25_000, write: 40_000, upload: 120_000 };
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
export async function request(path, { method = 'GET', body, params, multipart = false, token, gate: useGate = true } = {}) {
  if (gate && useGate && token === undefined) await gate;
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), multipart ? TIMEOUT_MS.upload : method === 'GET' ? TIMEOUT_MS.read : TIMEOUT_MS.write);

  let res;
  let json;
  try {
    res = await fetch(API_URL + path + toQuery(params), { method, headers, body: payload, signal: controller.signal });
    json = await res.json().catch(() => ({}));
  } catch {
    if (controller.signal.aborted) {
      reportServerFailure();
      throw new ApiError('The server is taking too long to answer. Please try again.', { code: 'timeout' });
    }
    // No internet is not the server's fault: the offline pill covers it, and polling already pauses.
    if (onlineManager.isOnline()) reportServerFailure();
    throw new ApiError('Network error. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) reportServerFailure({ tooMany: true });
  else if (res.status >= 500) reportServerFailure();
  else reportServerOk();

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
