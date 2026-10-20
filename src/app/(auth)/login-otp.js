import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { requestOtp } from '@/api/auth';
import { Banner, Button, Input, Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { fieldError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';

const RESEND_SECONDS = 30; // the server refuses a new code before this
const CODE_LENGTH = 6;

// Sign in with a code sent to the mobile number saved on your account (Profile, Phone).
export default function LoginWithOtp() {
  const { loginWithOtp } = useAuth();
  const { colors, spacing } = useTheme();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [wait, setWait] = useState(0); // seconds until another code can be asked for
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  // Count the resend timer down once a second while it is running.
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function sendCode() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setLocal({ phone: 'Enter the mobile number saved on your account.' });
      return;
    }
    setLocal({});
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone.trim());
      setStep('code');
      setCode('');
      setWait(RESEND_SECONDS);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  async function verify(value = code) {
    if (value.length !== CODE_LENGTH) {
      setLocal({ code: `Enter the ${CODE_LENGTH}-digit code.` });
      return;
    }
    setLocal({});
    setError(null);
    setLoading(true);
    try {
      await loginWithOtp(phone.trim(), value);
      haptics.success();
      // The root navigator swaps to the app once the session starts.
    } catch (e) {
      haptics.error();
      setError(e);
      setLoading(false);
    }
  }

  const onCode = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(clean);
    if (clean.length === CODE_LENGTH && !loading) verify(clean); // sign in as soon as the last digit is typed
  };

  const banner = error && !fieldError(error, 'phone') ? error.message : null;

  return (
    <AuthShell
      title="Sign in with a code"
      subtitle={step === 'phone' ? 'We will send a 6-digit code to the mobile number saved on your account.' : `Enter the code sent to ${phone.trim()}.`}
      footer={<Link href="/login" style={{ color: '#fff', fontWeight: '700' }}>Sign in with email instead</Link>}
    >
      <Banner message={banner} />

      {step === 'phone' ? (
        <>
          <Input
            label="Mobile number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="98765 43210"
            returnKeyType="go"
            onSubmitEditing={sendCode}
            error={local.phone ?? fieldError(error, 'phone')}
          />
          <Text variant="caption" muted style={{ marginTop: -8, marginBottom: spacing.lg }}>
            It must be the number in your Profile. If you have not saved one yet, sign in with email first and add it there.
          </Text>
          <Button title="Send code" loading={loading} onPress={sendCode} />
        </>
      ) : (
        <>
          <Banner tone="success" message="If this number is registered, a code is on its way. It stays valid for 5 minutes." />
          <Input
            label="Code"
            value={code}
            onChangeText={onCode}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            maxLength={CODE_LENGTH}
            autoFocus
            placeholder="------"
            style={{ fontSize: 26, letterSpacing: 8, textAlign: 'center' }}
            error={local.code}
          />
          <Button title="Verify and sign in" loading={loading} onPress={() => verify()} />
          <Button
            title={wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
            variant="ghost"
            disabled={wait > 0}
            onPress={sendCode}
            style={{ marginTop: spacing.sm }}
          />
          <Button title="Use a different number" variant="ghost" onPress={() => { setStep('phone'); setError(null); setWait(0); }} />
          <Text variant="caption" style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.sm }}>
            No code? It is sent over WhatsApp or SMS, depending on how your company set it up.
          </Text>
        </>
      )}
    </AuthShell>
  );
}
