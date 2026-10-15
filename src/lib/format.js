const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Chat-list timestamp: time today, "Yesterday", weekday this week, else date.
export function formatListTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY);
  if (diffDays <= 0) return formatTime(iso);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// Day separator label inside a chat.
export function formatDayLabel(iso) {
  const date = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

export function isSameDay(isoA, isoB) {
  return startOfDay(new Date(isoA)) === startOfDay(new Date(isoB));
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// "5m ago", "3h ago", "2d ago".
export function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// 12_600_000 ms -> "3h 30m", 2_700_000 -> "45m". Used for the 24-hour window countdown.
export function formatRemaining(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(mins / 60);
  return h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`;
}
