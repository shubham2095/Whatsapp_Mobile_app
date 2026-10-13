import { request } from './client';

// -> { agents: [{ id, name, email, roles, active_conversations_count, total_handled }] }
export const listAgents = () => request('/agents');

// -> { agent: { ...same, conversations: [{ id, contact_name, contact_phone, status, last_message_at }] } }
export const getAgent = (id) => request(`/agents/${id}`);

// -> { stats: [{ id, name, open, pending, resolved, closed, total }] }
export const agentStats = () => request('/agents/stats');

// Active teammates a chat can be handed to. -> { agents: [{ id, name, is_me }] }
export const assignableAgents = () => request('/agents/assignable');

export const assignConversation = ({ conversationId, agentId }) =>
  request('/agents/assign', { method: 'POST', body: { conversation_id: conversationId, agent_id: agentId } });

export const unassignConversation = (conversationId) =>
  request('/agents/unassign', { method: 'POST', body: { conversation_id: conversationId } });
