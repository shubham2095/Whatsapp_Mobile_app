import { useState } from 'react';
import { Link } from 'expo-router';
import { Banner, Button, Input, Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { GoogleButton } from '@/features/auth/GoogleButton';
import { useAuth } from '@/features/auth/AuthProvider';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function Register() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [form, setForm] = useState({ company_name: '', name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const [googleError, setGoogleError] = useState(null);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);

  async function submit() {
    const problems = {};
    if (!form.company_name.trim()) problems.company_name = 'Enter your company name.';
    if (!form.name.trim()) problems.name = 'Enter your name.';
    if (!isValidEmail(form.email)) problems.email = 'Enter a valid email address.';
    // Same rule as the backend: 8+ chars with upper, lower and a digit.
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      problems.password = 'Use 8+ characters with upper & lower case letters and a number.';
    }
    if (form.password !== form.password_confirmation) problems.password_confirmation = 'Passwords do not match.';
    setLocal(problems);
    setError(null);
    if (Object.keys(problems).length) return;

    setLoading(true);
    try {
      await register({
        company_name: form.company_name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  }

  const shownFields = ['company_name', 'name', 'email', 'phone', 'password', 'password_confirmation'];
  const bannerMessage = error && !shownFields.some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your company workspace in a minute."
      legalPrefix="By creating an account you agree to our"
      footer={
        <Text muted>
          Already have an account?{' '}
          <Link href="/login" style={{ color: colors.primary, fontWeight: '700' }}>Sign in</Link>
        </Text>
      }
    >
      <Banner message={googleError ?? bannerMessage} />
      <Input label="Company name" icon="business-outline" value={form.company_name} onChangeText={set('company_name')} autoCapitalize="words" error={err('company_name')} />
      <Input label="Your name" icon="person-outline" value={form.name} onChangeText={set('name')} autoCapitalize="words" autoComplete="name" error={err('name')} />
      <Input label="Email" icon="mail-outline" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={err('email')} />
      <Input label="Phone (optional)" icon="call-outline" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" error={err('phone')} />
      <Input label="Password" icon="lock-closed-outline" password value={form.password} onChangeText={set('password')} autoComplete="new-password" error={err('password')} />
      <Input label="Confirm password" icon="lock-closed-outline" password value={form.password_confirmation} onChangeText={set('password_confirmation')} autoComplete="new-password" error={err('password_confirmation')} />
      <Button title="Create account" size="lg" loading={loading} onPress={submit} />
      <GoogleButton onError={setGoogleError} style={{ marginTop: 12 }} />
    </AuthShell>
  );
}
