import { useState } from 'react';
import { ActivityIndicator, Switch, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Banner, Button, ChipSelect, Input, Screen, Text } from '@/components/ui';
import { useChatbot, useCreateChatbot, useUpdateChatbot } from '@/features/automation/hooks';
import { useNumbers } from '@/features/whatsapp/hooks';
import { fieldError } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

// Create a bot (no `id`) or edit its settings (`id`). Keyword rules are managed on the bot's own screen.
export default function ChatbotForm() {
  const { id } = useLocalSearchParams();
  const editing = typeof id === 'string';
  const { colors } = useTheme();
  const existing = useChatbot(editing ? id : null);

  if (editing && existing.isLoading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;
  if (editing && existing.isError) return <Screen><Banner message={existing.error.message} /></Screen>;
  return <Form bot={existing.data?.chatbot} />;
}

function Switchy({ label, hint, value, onChange }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600' }}>{label}</Text>
        {hint ? <Text variant="caption" muted>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} />
    </View>
  );
}

function Form({ bot }) {
  const editing = !!bot;
  const create = useCreateChatbot();
  const update = useUpdateChatbot();
  const numbers = useNumbers();
  const [form, setForm] = useState({
    name: bot?.name ?? '',
    phone_number_id: bot?.phone_number?.id ?? '',
    welcome_message: bot?.welcome_message ?? '',
    fallback_message: bot?.fallback_message ?? '',
    ai_enabled: bot?.ai_enabled ?? false,
    ai_instructions: bot?.ai_instructions ?? '',
    is_active: bot?.is_active ?? false,
  });
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);
  const busy = create.isPending || update.isPending;
  const numberOptions = [{ value: '', label: 'All numbers' }, ...(numbers.data?.numbers ?? []).map((n) => ({ value: n.id, label: n.display_phone_number }))];

  function submit() {
    const p = {};
    if (!form.name.trim()) p.name = 'Give the bot a name.';
    if (form.ai_enabled && !form.ai_instructions.trim()) p.ai_instructions = 'Tell the AI about your business so it can answer correctly.';
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    const body = {
      name: form.name.trim(),
      phone_number_id: form.phone_number_id || null,
      welcome_message: form.welcome_message.trim() || null,
      fallback_message: form.fallback_message.trim() || null,
      ai_enabled: form.ai_enabled,
      ai_instructions: form.ai_instructions.trim() || null,
      is_active: form.is_active,
    };
    const done = { onSuccess: (res) => (editing ? router.back() : router.replace({ pathname: '/chatbot/[id]', params: { id: res.chatbot.id } })), onError: setError };
    if (editing) update.mutate({ id: bot.id, ...body }, done);
    else create.mutate(body, done);
  }

  const known = ['name', 'phone_number_id', 'welcome_message', 'fallback_message', 'ai_instructions'];
  const bannerMessage = error && !known.some((k) => fieldError(error, k)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: editing ? 'Edit chatbot' : 'New chatbot' }} />
      <Banner message={bannerMessage} />
      <Input label="Bot name" value={form.name} onChangeText={set('name')} autoCapitalize="sentences" error={err('name')} />
      <ChipSelect label="Runs on" options={numberOptions} value={form.phone_number_id} onChange={set('phone_number_id')} />
      <Input label="Welcome message (first reply to a new customer)" value={form.welcome_message} onChangeText={set('welcome_message')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
      <Input label="Fallback message (when no rule matches)" value={form.fallback_message} onChangeText={set('fallback_message')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />

      <Switchy label="AI replies" hint="Let AI answer questions that no keyword rule covers." value={form.ai_enabled} onChange={set('ai_enabled')} />
      {form.ai_enabled ? (
        <Input
          label="About your business (instructions for the AI)"
          value={form.ai_instructions}
          onChangeText={set('ai_instructions')}
          multiline
          maxLength={8000}
          placeholder="What you sell, prices, timings, tone of voice, what not to say..."
          style={{ minHeight: 140, textAlignVertical: 'top' }}
          error={err('ai_instructions')}
        />
      ) : null}
      <Switchy label="Active" hint="Replies to customers right away when on." value={form.is_active} onChange={set('is_active')} />

      <Button title={editing ? 'Save changes' : 'Create chatbot'} loading={busy} onPress={submit} />
    </Screen>
  );
}
