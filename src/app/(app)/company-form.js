import { useState } from 'react';
import { router } from 'expo-router';
import { Banner, Button, ChipSelect, Input, Screen, Text } from '@/components/ui';
import { useCompanies, useCreateCompany } from '@/features/admin/hooks';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

// Super admin: create a company with its owner account.
export default function CompanyForm() {
  const { spacing } = useTheme();
  const create = useCreateCompany();
  const companies = useCompanies();
  const [form, setForm] = useState({ company_name: '', owner_name: '', owner_email: '', phone: '', password: '', plan_id: '' });
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);
  const planOptions = [{ value: '', label: 'No plan yet' }, ...(companies.data?.plans ?? []).map((p) => ({ value: p.id, label: p.name }))];

  function submit() {
    const p = {};
    if (!form.company_name.trim()) p.company_name = 'Enter the company name.';
    if (!form.owner_name.trim()) p.owner_name = 'Enter the owner name.';
    if (!isValidEmail(form.owner_email)) p.owner_email = 'Enter a valid email address.';
    if (form.password.length < 8) p.password = 'Use at least 8 characters.';
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    create.mutate(
      {
        company_name: form.company_name.trim(),
        owner_name: form.owner_name.trim(),
        owner_email: form.owner_email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        plan_id: form.plan_id || undefined,
      },
      { onSuccess: () => router.back(), onError: setError },
    );
  }

  const known = ['company_name', 'owner_name', 'owner_email', 'password', 'phone', 'plan_id'];
  const bannerMessage = error && !known.some((k) => fieldError(error, k)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Banner message={bannerMessage} />
      <Input label="Company name" value={form.company_name} onChangeText={set('company_name')} autoCapitalize="words" error={err('company_name')} />
      <Input label="Owner name" value={form.owner_name} onChangeText={set('owner_name')} autoCapitalize="words" error={err('owner_name')} />
      <Input label="Owner email" value={form.owner_email} onChangeText={set('owner_email')} keyboardType="email-address" autoCapitalize="none" error={err('owner_email')} />
      <Input label="Phone (optional)" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={err('phone')} />
      <Input label="Owner password" password value={form.password} onChangeText={set('password')} autoComplete="new-password" error={err('password')} />
      <Text variant="caption" muted style={{ marginTop: -8, marginBottom: spacing.md }}>Share this password with the owner. They can change it after signing in.</Text>
      <ChipSelect label="Plan" options={planOptions} value={form.plan_id} onChange={set('plan_id')} />
      <Button title="Create company" loading={create.isPending} onPress={submit} />
    </Screen>
  );
}
