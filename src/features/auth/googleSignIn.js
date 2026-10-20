import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { exchangeGoogleCode } from '@/api/auth';
import { API_URL } from '@/config';

// "Continue with Google". The phone opens the server's Google sign-in in a browser tab. When it finishes, the server sends
// the browser back to heltog://google-auth with a one-time code. The code is useless without the random secret
// ("verifier") that only this phone knows: the server was given just its hash at the start (PKCE).
// The app's URL scheme only exists in an installed build (preview / production APK), not in Expo Go.
const RETURN_URL = 'heltog://google-auth';

const MESSAGES = {
  not_configured: 'Google sign-in is not set up on the server yet.',
  account_disabled: 'This account has been disabled.',
  no_email: 'Google did not share an email address, so we could not sign you in.',
  invalid_state: 'The sign-in took too long. Please try again.',
  token_exchange_failed: 'Google sign-in failed. Please try again.',
  profile_failed: 'Google sign-in failed. Please try again.',
  bad_request: 'Google sign-in failed. Please try again.',
};

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

// "?code=abc&error=x" from a heltog://google-auth?... address.
function queryOf(url) {
  const query = url.split('#')[0].split('?')[1] ?? '';
  const out = {};
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const [key, value = ''] = pair.split('=');
    out[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  return out;
}

// Resolves to the login answer ({ user, token, ... }), or null when the person closed the browser without signing in.
// Throws an Error with a readable message for everything else.
export async function signInWithGoogle() {
  const verifier = toHex(await Crypto.getRandomBytesAsync(32)); // 64 hex characters
  const challenge = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier); // hex by default

  const result = await WebBrowser.openAuthSessionAsync(`${API_URL}/auth/google/redirect?app=1&challenge=${challenge}`, RETURN_URL);
  if (result.type !== 'success') return null;

  const { code, error } = queryOf(result.url);
  if (error === 'cancelled') return null;
  if (error || !code) throw new Error(MESSAGES[error] ?? 'Google sign-in failed. Please try again.');

  return exchangeGoogleCode(code, verifier);
}
