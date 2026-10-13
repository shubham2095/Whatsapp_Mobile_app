import { DEFAULT_COUNTRY_CODE } from '@/config';

/**
 * Turns whatever a person typed (or a phone book / CSV holds) into the digits-only international
 * number WhatsApp needs. Bare local numbers get `defaultCode` prefixed:
 *   "+91 98765 43210" -> 919876543210   "98765-43210" -> 919876543210
 *   "09876543210"     -> 919876543210   "0091 98765 43210" -> 919876543210
 * Anything else is returned as digits unchanged (assumed to already carry a country code).
 */
export function normalizePhone(raw, defaultCode = DEFAULT_COUNTRY_CODE) {
  const text = String(raw ?? '').trim();
  const digits = text.replace(/\D/g, '');
  if (!digits) return '';
  if (text.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.length === 10) return defaultCode + digits;
  if (digits.length === 11 && digits.startsWith('0')) return defaultCode + digits.slice(1);
  return digits;
}

// The backend skips anything under 10 digits.
export const isDialable = (normalized) => normalized.length >= 10 && normalized.length <= 15;

export function displayPhone(digits) {
  return digits ? `+${digits}` : '';
}
