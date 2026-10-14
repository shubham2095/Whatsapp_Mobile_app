import { request } from './client';

// -> { connection: { id, page_id, page_name, ig_user_id, ig_username, instagram_linked, status, connected_at } | null }
export const getConnection = () => request('/social/connection');

// body: { page_id, page_access_token } (a Facebook Page token with publishing permissions)
export const connectPage = (body) => request('/social/connect', { method: 'POST', body });
export const recheckInstagram = () => request('/social/recheck-instagram', { method: 'POST' });
export const disconnect = () => request('/social/connection', { method: 'DELETE' });

// -> { posts: [{ id, caption, image_url, media_type, targets, status, results, scheduled_at, published_at, created_at }] }
export const listPosts = () => request('/social/posts');

// Media: either image { uri, name, mimeType } (photo or video up to 200 MB) or imageUrl (a public link).
// targets: ['facebook', 'instagram'].
// scheduled_at: ISO string in the future, or omitted for a draft.
export function createPost({ caption, image, imageUrl, targets, scheduledAt }) {
  const form = new FormData();
  if (caption) form.append('caption', caption);
  targets.forEach((t) => form.append('targets[]', t));
  if (scheduledAt) form.append('scheduled_at', scheduledAt);
  if (image) form.append('image', { uri: image.uri, name: image.name, type: image.mimeType });
  else form.append('image_url', imageUrl);
  return request('/social/posts', { method: 'POST', body: form, multipart: true });
}

// -> { post }
export const publishPost = (id) => request(`/social/posts/${id}/publish`, { method: 'POST' });

// -> { post, note }
export const updatePost = (id, { caption }) => request(`/social/posts/${id}`, { method: 'PUT', body: { caption } });

// -> { message, note }
export const deletePost = (id) => request(`/social/posts/${id}`, { method: 'DELETE' });
