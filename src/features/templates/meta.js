// Display helpers shared by the template list, detail and builder.

export const STATUS_TONE = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
  PAUSED: 'neutral',
  DISABLED: 'neutral',
};

export const CATEGORY_LABEL = { MARKETING: 'Marketing', UTILITY: 'Utility', AUTHENTICATION: 'Authentication' };
export const CATEGORY_TONE = { MARKETING: 'accent', UTILITY: 'neutral', AUTHENTICATION: 'warning' };

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt_BR', label: 'Portuguese (BR)' },
  { code: 'ar', label: 'Arabic' },
  { code: 'id', label: 'Indonesian' },
];

export const HEADER_FORMATS = ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'];

export const BUTTON_TYPES = [
  { value: 'QUICK_REPLY', label: 'Quick reply', icon: 'return-down-forward-outline' },
  { value: 'URL', label: 'Visit website', icon: 'link-outline' },
  { value: 'PHONE_NUMBER', label: 'Call phone number', icon: 'call-outline' },
  { value: 'COPY_CODE', label: 'Copy offer code', icon: 'copy-outline' },
];

// Distinct {{n}} placeholder numbers in a body, ascending. "Hi {{2}} {{1}} {{1}}" -> [1, 2]
export function variableNumbers(body) {
  const found = new Set();
  for (const m of body.matchAll(/\{\{\s*(\d+)\s*\}\}/g)) found.add(Number(m[1]));
  return [...found].sort((a, b) => a - b);
}

// Meta needs placeholders to be sequential from 1.
export const variablesAreSequential = (nums) => nums.every((n, i) => n === i + 1);

// Fills {{n}} with sample values for previews; unknown ones stay as {{n}}.
export function fillVariables(text, samples = {}) {
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (all, n) => samples[Number(n)] || `{{${n}}}`);
}
