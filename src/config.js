export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://main.heltog.com/api/v1';

// Prefixed to bare 10-digit numbers typed or imported without a country code (India).
export const DEFAULT_COUNTRY_CODE = '91';

// The public website: legal pages live here. Play Store listing needs the same privacy URL.
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://frontend.heltog.com';
export const LEGAL_URLS = {
  privacy: `${WEB_URL}/privacy`,
  terms: `${WEB_URL}/terms`,
  deleteAccount: `${WEB_URL}/delete-account`,
};
export const SUPPORT_EMAIL = 'heltogtechnologies@gmail.com';
