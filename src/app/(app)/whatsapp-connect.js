import { useState } from 'react';
import { router } from 'expo-router';
import { Banner, Button, Card, Input, Screen, Text } from '@/components/ui';
import { useConnectNumber } from '@/features/whatsapp/hooks';
import { fieldError } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

// Manual connection with a Meta System User token. (One-click Embedded Signup needs the Facebook
// web SDK and is only available on the web app.)
export default function WhatsappConnect() {
  const { spacing } = useTheme();
  const connect = useConnectNumber();
  const [form, setForm] = useState({ waba_id: '', phone_number_id: '', display_phone_number: '', access_token: '', name: '' });
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);

  function submit() {
    const problems = {};
    if (!form.waba_id.trim()) problems.waba_id = 'Enter the WhatsApp Business Account ID.';
    if (!form.phone_number_id.trim()) problems.phone_number_id = 'Enter the Phone number ID.';
    if (!form.display_phone_number.trim()) problems.display_phone_number = 'Enter the phone number.';
    if (form.access_token.trim().length < 20) problems.access_token = 'Paste the full access token.';
    setLocal(problems);
    setError(null);
    if (Object.keys(problems).length) return;

    connect.mutate(
      {
        waba_id: form.waba_id.trim(),
        phone_number_id: form.phone_number_id.trim(),
        display_phone_number: form.display_phone_number.trim(),
        access_token: form.access_token.trim(),
        name: form.name.trim() || undefined,
      },
      { onSuccess: () => router.back(), onError: setError },
    );
  }

  const fields = ['waba_id', 'phone_number_id', 'display_phone_number', 'access_token', 'name'];
  const bannerMessage = error && !fields.some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Card style={{ marginBottom: spacing.lg, gap: spacing.xs }}>
        <Text style={{ fontWeight: '600' }}>Where to find these</Text>
        <Text variant="small" muted>
          Meta Business Suite, WhatsApp Manager, API setup. The access token should be a permanent System User token with whatsapp_business_messaging and whatsapp_business_management permissions. It is stored encrypted on the server.
        </Text>
      </Card>
      <Banner message={bannerMessage} />
      <Input label="WhatsApp Business Account ID" value={form.waba_id} onChangeText={set('waba_id')} keyboardType="number-pad" error={err('waba_id')} />
      <Input label="Phone number ID" value={form.phone_number_id} onChangeText={set('phone_number_id')} keyboardType="number-pad" error={err('phone_number_id')} />
      <Input label="Phone number" value={form.display_phone_number} onChangeText={set('display_phone_number')} keyboardType="phone-pad" placeholder="+91 98765 43210" error={err('display_phone_number')} />
      <Input label="Access token" value={form.access_token} onChangeText={set('access_token')} password autoCorrect={false} error={err('access_token')} />
      <Input label="Account name (optional)" value={form.name} onChangeText={set('name')} autoCapitalize="words" error={err('name')} />
      <Button title="Connect number" loading={connect.isPending} onPress={submit} />
    </Screen>
  );
}
