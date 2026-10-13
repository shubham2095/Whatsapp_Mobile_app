import { useState } from 'react';
import { router } from 'expo-router';
import { changePassword } from '@/api/auth';
import { Banner, Button, Input, Screen } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { fieldError } from '@/lib/errors';

export default function ChangePassword() {
  const user = useUser();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);

  async function submit() {
    const problems = {};
    // Super admins don't need to supply their current password.
    if (!user.is_super_admin && !form.current_password) problems.current_password = 'Enter your current password.';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      problems.password = 'Use 8+ characters with upper & lower case letters and a number.';
    }
    if (form.password !== form.password_confirmation) problems.password_confirmation = 'Passwords do not match.';
    setLocal(problems);
    setError(null);
    if (Object.keys(problems).length) return;

    setLoading(true);
    try {
      await changePassword(user.is_super_admin ? { password: form.password, password_confirmation: form.password_confirmation } : form);
      setDone(true);
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  const bannerMessage = error && !['current_password', 'password', 'password_confirmation'].some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <Screen scroll>
      <Banner message={bannerMessage} />
      <Banner tone="success" message={done ? 'Password changed successfully.' : null} />
      {user.is_super_admin ? null : (
        <Input label="Current password" password value={form.current_password} onChangeText={set('current_password')} autoComplete="current-password" error={err('current_password')} />
      )}
      <Input label="New password" password value={form.password} onChangeText={set('password')} autoComplete="new-password" error={err('password')} />
      <Input label="Confirm new password" password value={form.password_confirmation} onChangeText={set('password_confirmation')} autoComplete="new-password" error={err('password_confirmation')} />
      <Button title="Update password" loading={loading} onPress={submit} />
      {done ? <Button title="Done" variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} /> : null}
    </Screen>
  );
}
