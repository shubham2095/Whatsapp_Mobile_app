import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Banner, Button, Input, Screen, Text } from '@/components/ui';
import { useContact, useCreateContact, useUpdateContact } from '@/features/contacts/hooks';
import { fieldError, isValidEmail } from '@/lib/errors';
import { isDialable, normalizePhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

// Add (no `id` param) or edit (`id` param) a contact.
export default function ContactForm() {
  const { id } = useLocalSearchParams();
  const editing = typeof id === 'string';
  const { colors } = useTheme();
  const existing = useContact(editing ? id : null);

  if (editing && existing.isLoading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;
  if (editing && existing.isError) {
    return (
      <Screen>
        <Banner message={existing.error.message} />
      </Screen>
    );
  }
  // Mount the form only once the contact is loaded so its fields start with real values.
  return <Form contact={existing.data?.contact} />;
}

function Form({ contact }) {
  const editing = !!contact;
  const create = useCreateContact();
  const update = useUpdateContact(contact?.id);
  const [form, setForm] = useState({
    phone: '',
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    company: contact?.company ?? '',
    tag_list: contact?.tag_list ?? '',
  });
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);
  const busy = create.isPending || update.isPending;

  function submit() {
    const problems = {};
    const phone = normalizePhone(form.phone);
    if (!editing && !isDialable(phone)) problems.phone = 'Enter a valid mobile number with country code.';
    if (form.email.trim() && !isValidEmail(form.email)) problems.email = 'Enter a valid email address.';
    setLocal(problems);
    setError(null);
    if (Object.keys(problems).length) return;

    const common = {
      name: form.name.trim() || undefined,
      email: form.email.trim() || undefined,
      company: form.company.trim() || undefined,
      tag_list: form.tag_list.trim(),
    };
    const done = {
      onSuccess: () => router.back(),
      onError: setError,
    };
    if (editing) update.mutate(common, done);
    else create.mutate({ ...common, phone, tag_list: common.tag_list || undefined }, done);
  }

  const fields = ['phone', 'name', 'email', 'company', 'tag_list'];
  const bannerMessage = error && !fields.some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: editing ? 'Edit contact' : 'Add contact' }} />
      <Banner message={bannerMessage} />
      {editing ? null : (
        <>
          <Input
            label="WhatsApp number"
            value={form.phone}
            onChangeText={set('phone')}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="98765 43210 or +1 555 123 4567"
            error={err('phone')}
          />
          <Text variant="caption" muted style={{ marginTop: -8, marginBottom: 12 }}>
            Numbers without a country code get +91.
          </Text>
        </>
      )}
      <Input label="Name" value={form.name} onChangeText={set('name')} autoCapitalize="words" error={err('name')} />
      <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={err('email')} />
      <Input label="Company" value={form.company} onChangeText={set('company')} autoCapitalize="words" error={err('company')} />
      <Input label="Tags" value={form.tag_list} onChangeText={set('tag_list')} autoCapitalize="none" placeholder="vip, delhi, lead" error={err('tag_list')} />
      <Button title={editing ? 'Save changes' : 'Add contact'} loading={busy} onPress={submit} />
    </Screen>
  );
}
