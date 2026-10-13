import { request } from './client';

// Answers questions about the signed-in user's own data. Limited to 20 requests a minute.
// -> { answer, snapshot }
export const ask = (question) => request('/assistant/ask', { method: 'POST', body: { question } });
