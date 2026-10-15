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
  sheet: '#ffffff', // bottom sheets and menus
  text: '#111b21',
  muted: '#5b6b74', // 5.3:1 on the page background (the old grey was 4.4:1)
  border: '#e3e8ea',
  inputBg: '#ffffff',
  chipBg: '#e6f4f3',
  bubbleIn: '#ffffff',
  bubbleOut: '#d9fdd3',
  handle: '#cfd6d9', // the little grab bar on sheets
};

export const darkColors = {
  ...base,
  bg: '#0c1616',
  card: '#142020',
  sheet: '#1a2b2b', // one step lighter than cards, so a sheet reads as "above" them
  text: '#e6efee',
  muted: '#98aca9',
  border: '#243b3a',
  inputBg: '#142020',
  chipBg: '#1f3130',
  bubbleIn: '#1f3130',
  bubbleOut: '#0b4f4a',
  handle: '#3a5352',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
// A 4-point grid: every gap and padding in the app should be one of these.
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const fontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 22, xxl: 28 };
// Smallest comfortable tap target (Android guideline is 48dp, iOS 44pt).
export const touch = 44;

// Light mode lifts cards with a soft shadow; dark mode relies on the border and lighter surfaces instead.
export const lightShadows = {
  card: { shadowColor: '#0b1f1f', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  raised: { shadowColor: '#0b1f1f', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
};
export const darkShadows = {
  card: {},
  raised: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
};
