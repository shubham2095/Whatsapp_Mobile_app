export const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const CATEGORIES = [
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'account', label: 'Account' },
  { value: 'other', label: 'Other' },
];

export const STATUS_TONE = { open: 'warning', in_progress: 'neutral', resolved: 'success', closed: 'muted' };
export const PRIORITY_TONE = { low: 'muted', medium: 'neutral', high: 'warning', urgent: 'danger' };

export const statusLabel = (s) => STATUSES.find((x) => x.value === s)?.label ?? s;
