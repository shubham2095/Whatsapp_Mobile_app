import { useState } from 'react';
import { Button } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useAuth } from './AuthProvider';
import { signInWithGoogle } from './googleSignIn';

// "Continue with Google". `onError(message)` shows a problem on the screen; `onError(null)` clears it.
export function GoogleButton({ onError, style, compact = false }) {
  const { loginWithPayload } = useAuth();
  const [loading, setLoading] = useState(false);

  async function press() {
    onError?.(null);
    setLoading(true);
    try {
      const payload = await signInWithGoogle();
      if (payload) {
        haptics.success();
        await loginWithPayload(payload); // the root navigator then swaps to the app
        return;
      }
    } catch (e) {
      haptics.error();
      onError?.(e.message);
    }
    setLoading(false);
  }

  return <Button title={compact ? 'Google' : 'Continue with Google'} variant="outline" icon="logo-google" loading={loading} onPress={press} style={style} />;
}
