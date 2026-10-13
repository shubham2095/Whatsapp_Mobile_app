export const WORKFLOW_TONE = { active: 'success', paused: 'warning', draft: 'muted' };

export const EXECUTION_TONE = { completed: 'success', running: 'neutral', waiting: 'warning', failed: 'danger', cancelled: 'muted' };

// "keyword_match" -> "Keyword match"
export function triggerLabel(type) {
  if (!type) return 'No trigger';
  const text = String(type).replace(/[_-]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
