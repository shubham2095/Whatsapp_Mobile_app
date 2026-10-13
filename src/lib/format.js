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
