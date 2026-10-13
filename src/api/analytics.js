import { request } from './client';

// -> { total_contacts, total_conversations, open_conversations, messages_today, messages_this_week,
//      messages_this_month, outbound_today, inbound_today, templates_approved, active_campaigns, total_campaigns }
export const dashboardStats = () => request('/analytics/dashboard');

// days: up to 90. -> { daily: [{ date, sent, delivered, read, failed, inbound }], totals: {...} }
export const messageStats = (days = 30) => request('/analytics/messages', { params: { days } });

// -> { campaigns: [{ name, status, total_recipients, sent_count, delivered_count, read_count, failed_count, delivery_rate, read_rate }] }
export const campaignStats = () => request('/analytics/campaigns');
