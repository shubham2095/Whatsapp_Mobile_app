import { useState } from 'react';
import { Link, router } from 'expo-router';
import { forgotPassword } from '@/api/auth';
import { Banner, Button, Input, Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function ForgotPassword() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState(null);

  async function submit() {
    setError(null);
    if (!isValidEmail(email)) {
      setLocal('Enter a valid email address.');
      return;
    }
    setLocal(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a link to reset it."
      footer={
        <Link href="/login" style={{ color: colors.primary, fontWeight: '700' }}>Back to sign in</Link>
      }
    >
      {sent ? (
        <>
          <Banner tone="success" message="If that email exists, a reset link has been sent. Check your inbox." />
          <Text muted style={{ marginBottom: 16 }}>
            The email has a reset link and token. Open the link on any device, or tap below to enter the token here.
          </Text>
          <Button title="I have my reset token" onPress={() => router.push({ pathname: '/reset-password', params: { email: email.trim() } })} />
          <Button title="Resend email" variant="ghost" loading={loading} onPress={submit} style={{ marginTop: 8 }} />
        </>
      ) : (
        <>
          <Banner message={error?.message} />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="go"
            onSubmitEditing={submit}
            error={local ?? fieldError(error, 'email')}
          />
          <Button title="Send reset link" loading={loading} onPress={submit} />
          <Text variant="small" muted style={{ marginTop: 16, textAlign: 'center' }}>
            Already have a token?{' '}
            <Link href="/reset-password" style={{ color: colors.primary, fontWeight: '600' }}>Enter it here</Link>
          </Text>
        </>
      )}
    </AuthShell>
  );
}
