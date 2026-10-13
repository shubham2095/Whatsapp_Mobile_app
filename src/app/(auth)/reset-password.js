import { useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { resetPassword } from '@/api/auth';
import { Banner, Button, Input } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { fieldError, isValidEmail } from '@/lib/errors';

export default function ResetPassword() {
  const params = useLocalSearchParams();
  const [form, setForm] = useState({
    email: typeof params.email === 'string' ? params.email : '',
    token: typeof params.token === 'string' ? params.token : '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);

  async function submit() {
    const problems = {};
    if (!isValidEmail(form.email)) problems.email = 'Enter a valid email address.';
    if (!form.token.trim()) problems.token = 'Paste the token from the email.';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      problems.password = 'Use 8+ characters with upper & lower case letters and a number.';
    }
    if (form.password !== form.password_confirmation) problems.password_confirmation = 'Passwords do not match.';
    setLocal(problems);
    setError(null);
    if (Object.keys(problems).length) return;

    setLoading(true);
    try {
      await resetPassword({ ...form, email: form.email.trim(), token: form.token.trim() });
      setDone(true);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  const fields = ['email', 'token', 'password', 'password_confirmation'];
  const bannerMessage = error && !fields.some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the token from your reset email and choose a new password."
      footer={<Link href="/login" style={{ color: '#fff', fontWeight: '700' }}>Back to sign in</Link>}
    >
      {done ? (
        <>
          <Banner tone="success" message="Password reset. You can now sign in." />
          <Button title="Go to sign in" onPress={() => router.replace('/login')} />
        </>
      ) : (
        <>
          <Banner message={bannerMessage} />
          <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={err('email')} />
          <Input label="Reset token" value={form.token} onChangeText={set('token')} autoCapitalize="none" autoCorrect={false} error={err('token')} />
          <Input label="New password" password value={form.password} onChangeText={set('password')} autoComplete="new-password" error={err('password')} />
          <Input label="Confirm new password" password value={form.password_confirmation} onChangeText={set('password_confirmation')} autoComplete="new-password" error={err('password_confirmation')} />
          <Button title="Reset password" loading={loading} onPress={submit} />
        </>
      )}
    </AuthShell>
  );
}
