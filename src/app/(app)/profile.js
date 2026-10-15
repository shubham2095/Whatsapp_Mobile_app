import { useState } from 'react';
import { router } from 'expo-router';
import { updateProfile } from '@/api/auth';
import { Banner, Button, Input, Screen } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { fieldError, isValidEmail } from '@/lib/errors';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const err = (key) => local[key] ?? fieldError(error, key);

  async function submit() {
    const problems = {};
    if (!form.name.trim()) problems.name = 'Enter your name.';
    if (!isValidEmail(form.email)) problems.email = 'Enter a valid email address.';
    setLocal(problems);
    setError(null);
    if (Object.keys(problems).length) return;

    setLoading(true);
    try {
      const data = await updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null });
      setUser(data.user);
      setSaved(true);
      toast.show('Profile updated');
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  const bannerMessage = error && !['name', 'email', 'phone'].some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <Screen scroll>
      <Banner message={bannerMessage} />
      <Banner tone="success" message={saved ? 'Profile updated.' : null} />
      <Input label="Name" value={form.name} onChangeText={set('name')} autoCapitalize="words" error={err('name')} />
      <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={err('email')} />
      <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={err('phone')} />
      <Button title="Save changes" loading={loading} onPress={submit} />
      <Button title="Change password" variant="outline" onPress={() => router.push('/change-password')} style={{ marginTop: 12 }} />
      {user.is_super_admin ? null : (
        <Button title="Delete account" variant="ghost" onPress={() => router.push('/delete-account')} style={{ marginTop: 24 }} />
      )}
    </Screen>
  );
}
