import { request } from './client';

// -> { chatbots: [{ id, name, is_active, welcome_message, fallback_message, ai_enabled, ai_instructions,
//                   phone_number: { id, display_phone_number } | null, rules_count, created_at }], meta }
export const listChatbots = ({ search, page = 1, perPage = 25 } = {}) =>
  request('/chatbots', { params: { search, page, per_page: perPage } });

// -> { chatbot } with `rules: [{ id, keyword, match_type, response_text, response_type, template_name, priority, is_active }]`
export const getChatbot = (id) => request(`/chatbots/${id}`);

// body: { name, phone_number_id?, welcome_message?, fallback_message?, is_active?, ai_enabled?, ai_instructions? }
export const createChatbot = (body) => request('/chatbots', { method: 'POST', body });
export const updateChatbot = (id, body) => request(`/chatbots/${id}`, { method: 'PUT', body });
export const deleteChatbot = (id) => request(`/chatbots/${id}`, { method: 'DELETE' });
export const toggleChatbot = (id) => request(`/chatbots/${id}/toggle`, { method: 'POST' });

// body: { keyword, match_type: exact|contains|starts_with|regex, response_type: text|template,
//         response_text?, template_name?, priority?, is_active? } -> { rule }
export const addRule = (id, body) => request(`/chatbots/${id}/rules`, { method: 'POST', body });
export const updateRule = (id, ruleId, body) => request(`/chatbots/${id}/rules/${ruleId}`, { method: 'PUT', body });
export const deleteRule = (id, ruleId) => request(`/chatbots/${id}/rules/${ruleId}`, { method: 'DELETE' });
