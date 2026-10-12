import { request } from './client';

export const health = () => request('/health', { token: null });
