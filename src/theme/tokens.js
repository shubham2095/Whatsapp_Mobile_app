// Brand tokens ported from the web app (frontend/app/globals.css).
const base = {
  primary: '#0e7c7b',
  primaryDark: '#0a5555',
  primaryLight: '#17b6a6',
  accent: '#f26f21',
  accentDark: '#d95e10',
  danger: '#e02424',
  success: '#16a34a',
  warning: '#d97706',
};

export const lightColors = {
  ...base,
  bg: '#f0f2f5',
  card: '#ffffff',
  text: '#111b21',
  muted: '#667781',
  border: '#e9edef',
  inputBg: '#ffffff',
  chipBg: '#e6f4f3',
  bubbleIn: '#ffffff',
  bubbleOut: '#d9fdd3',
};

export const darkColors = {
  ...base,
  bg: '#0f1a1a',
  card: '#162222',
  text: '#e6efee',
  muted: '#93a7a4',
  border: '#24403f',
  inputBg: '#162222',
  chipBg: '#1f3130',
  bubbleIn: '#1f3130',
  bubbleOut: '#0b4f4a',
};

export const radius = { sm: 8, md: 12, lg: 14, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const fontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 22, xxl: 28 };
