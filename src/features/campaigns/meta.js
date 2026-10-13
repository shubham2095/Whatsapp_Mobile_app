// Display helpers shared by campaigns and bulk sends.

export const STATUS_TONE = {
  draft: 'muted',
  scheduled: 'warning',
  running: 'neutral',
  processing: 'neutral',
  paused: 'warning',
  completed: 'success',
  sent: 'success',
  cancelled: 'muted',
  failed: 'danger',
  pending: 'muted',
  delivered: 'success',
  read: 'success',
};

export const pct = (part, whole) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '0%');

// Everything the backend counts as "done with" for a campaign.
export const doneCount = (c) => c.sent_count + c.failed_count;
