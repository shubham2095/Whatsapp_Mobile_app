import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Banner, Button, Input, Screen, Text } from '@/components/ui';
import { useAdminSettings, useUpdateSettings } from '@/features/admin/hooks';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

// Super admin: the seller details and GST rate printed on every invoice.
export default function AdminSettings() {
  const { colors } = useTheme();
  const settings = useAdminSettings();
  if (settings.isLoading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;
  if (settings.isError) return <Screen><Banner message={settings.error.message} /></Screen>;
  return <Form initial={settings.data.settings} />;
}

function Form({ initial }) {
  const { spacing } = useTheme();
  const save = useUpdateSettings();
  const [form, setForm] = useState({
    company_name: initial.company_name ?? '',
    address: initial.address ?? '',
    gstin: initial.gstin ?? '',
    tax_details: initial.tax_details ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    invoice_prefix: initial.invoice_prefix ?? '',
    gst_rate: initial.gst_rate != null ? String(initial.gst_rate) : '',
  });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const err = (key) => local[key] ?? fieldError(error, key);

  function submit() {
    const p = {};
    if (form.email.trim() && !isValidEmail(form.email)) p.email = 'Enter a valid email address.';
    if (form.gst_rate && (Number(form.gst_rate) < 0 || Number(form.gst_rate) > 100)) p.gst_rate = 'Use a whole number from 0 to 100.';
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    // Empty boxes are sent as null so a field can be cleared.
    const text = (v) => v.trim() || null;
    save.mutate(
      {
        company_name: text(form.company_name),
        address: text(form.address),
        gstin: text(form.gstin)?.toUpperCase() ?? null,
        tax_details: text(form.tax_details),
        email: text(form.email),
        phone: text(form.phone),
        invoice_prefix: text(form.invoice_prefix),
        gst_rate: form.gst_rate === '' ? null : Number(form.gst_rate),
      },
      { onSuccess: () => setSaved(true), onError: setError },
    );
  }

  const known = ['company_name', 'address', 'gstin', 'tax_details', 'email', 'phone', 'invoice_prefix', 'gst_rate'];
  const bannerMessage = error && !known.some((k) => fieldError(error, k)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Text variant="small" muted style={{ marginBottom: spacing.md }}>These details appear as the seller on every invoice, and the GST rate is added to every plan purchase.</Text>
      <Banner message={bannerMessage} />
      <Banner tone="success" message={saved ? 'Settings saved.' : null} />
      <Input label="Company / business name" value={form.company_name} onChangeText={set('company_name')} autoCapitalize="words" error={err('company_name')} />
      <Input label="Business address" value={form.address} onChangeText={set('address')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} error={err('address')} />
      <Input label="GSTIN" value={form.gstin} onChangeText={set('gstin')} autoCapitalize="characters" maxLength={20} error={err('gstin')} />
      <Input label="Tax details (PAN / CIN)" value={form.tax_details} onChangeText={set('tax_details')} autoCapitalize="characters" error={err('tax_details')} />
      <Input label="Billing email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={err('email')} />
      <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={err('phone')} />
      <Input label="Invoice prefix" value={form.invoice_prefix} onChangeText={set('invoice_prefix')} autoCapitalize="characters" maxLength={16} placeholder="INV" error={err('invoice_prefix')} />
      <Input label="GST rate (%)" value={form.gst_rate} onChangeText={(v) => set('gst_rate')(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="18" error={err('gst_rate')} />
      <Button title="Save settings" loading={save.isPending} onPress={submit} />
    </Screen>
  );
}
