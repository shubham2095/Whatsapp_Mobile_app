import { request } from './client';

// -> { workflows: [{ id, name, description, status (draft|active|paused), trigger_type, trigger_config,
//                    version, activated_at, nodes_count, executions_count, created_at }], meta }
export const listWorkflows = ({ search, status, page = 1, perPage = 25 } = {}) =>
  request('/automations', { params: { search, status, page, per_page: perPage } });

// -> { workflow } with nodes and edges
export const getWorkflow = (id) => request(`/automations/${id}`);

// From draft or paused. Needs an entry node.
export const activateWorkflow = (id) => request(`/automations/${id}/activate`, { method: 'POST' });
export const pauseWorkflow = (id) => request(`/automations/${id}/pause`, { method: 'POST' });
export const deleteWorkflow = (id) => request(`/automations/${id}`, { method: 'DELETE' });

// -> { executions: [{ id, status, current_node_key, contact: { id, name, phone } | null, started_at, finished_at }], meta }
export const listExecutions = (id, { page = 1, perPage = 25 } = {}) =>
  request(`/automations/${id}/executions`, { params: { page, per_page: perPage } });
