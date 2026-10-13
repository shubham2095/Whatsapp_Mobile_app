import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Input, Screen, Text } from '@/components/ui';
import { useSendBulk, useTemplateNeeds } from '@/features/campaigns/hooks';
import { TemplateSelect } from '@/features/campaigns/TemplateSelect';
import { fieldError } from '@/lib/errors';
import { isDialable, normalizePhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

const MAX_NUMBERS = 1000;

// Split on new lines, commas, semicolons; normalise; drop invalid and duplicate numbers.
function parseNumbers(text) {
  const seen = new Set();
  let invalid = 0;
  for (const raw of text.split(/[\n,;]+/)) {
    if (!raw.trim()) continue;
    const n = normalizePhone(raw);
    if (!isDialable(n)) invalid += 1;
    else seen.add(n);
  }
  return { numbers: [...seen], invalid };
}

export default function BulkForm() {
  const { spacing } = useTheme();
  const send = useSendBulk();
  const [text, setText] = useState('');
  const [template, setTemplate] = useState(null);
  const [vars, setVars] = useState({});
  const [mediaUrl, setMediaUrl] = useState('');
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const needs = useTemplateNeeds(template?.id);

  const { numbers, invalid } = useMemo(() => parseNumbers(text), [text]);
  const err = (key) => local[key] ?? fieldError(error, key);

  function pickTemplate(t) {
    setTemplate(t);
    setVars({});
    setMediaUrl('');
  }

  function submit() {
    const p = {};
    if (numbers.length === 0) p.numbers = 'Add at least one valid mobile number.';
    if (numbers.length > MAX_NUMBERS) p.numbers = `You can send to ${MAX_NUMBERS} numbers at a time.`;
    if (!template) p.template = 'Choose a template.';
    const values = Array.from({ length: needs.varCount }, (_, i) => (vars[i + 1] ?? '').trim());
    if (values.some((v) => !v)) p.vars = 'Fill in every template variable.';
    if (needs.mediaHeader && !/^https?:\/\//i.test(mediaUrl.trim())) p.header_media_url = `Paste a public https link to the ${needs.mediaHeader.toLowerCase()}.`;
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    Alert.alert('Send bulk message', `Send "${template.name}" to ${numbers.length} number${numbers.length > 1 ? 's' : ''}? Messages cannot be recalled once sent. Blocked numbers on your black list are skipped automatically.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send now',
        onPress: () =>
          send.mutate(
            {
              numbers,
              template: template.name,
              language: template.language,
              variables: values.length ? values : undefined,
              header_media_url: needs.mediaHeader ? mediaUrl.trim() : undefined,
            },
            { onSuccess: (res) => router.replace({ pathname: '/bulk/[id]', params: { id: res.bulk_send.uuid } }), onError: setError },
          ),
      },
    ]);
  }

  const fields = ['numbers', 'template', 'header_media_url'];
  const bannerMessage = error && !fields.some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Banner message={bannerMessage} />
      <Input
        label="Mobile numbers"
        value={text}
        onChangeText={setText}
        multiline
        keyboardType="phone-pad"
        placeholder={'98765 43210\n+1 555 123 4567'}
        style={{ minHeight: 130, textAlignVertical: 'top' }}
        error={err('numbers')}
      />
      <Text variant="caption" muted style={{ marginTop: -8, marginBottom: spacing.md }}>
        One per line (or separated by commas). Numbers without a country code get +91. {numbers.length} valid{invalid ? `, ${invalid} invalid will be skipped` : ''}.
      </Text>

      <TemplateSelect value={template} onChange={pickTemplate} error={err('template')} />

      {template && needs.isLoading ? <Text variant="small" muted style={{ marginBottom: spacing.md }}>Checking template...</Text> : null}
      {template && needs.isError ? <Banner tone="warning" message="Could not load the template details. Variables and media may be missing." /> : null}

      {needs.varCount > 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="small" muted style={{ marginBottom: spacing.sm }}>
            Template variables. The same values go to every number.
          </Text>
          {Array.from({ length: needs.varCount }, (_, i) => (
            <Input key={i} label={`{{${i + 1}}}`} value={vars[i + 1] ?? ''} onChangeText={(v) => setVars((s) => ({ ...s, [i + 1]: v }))} />
          ))}
          {local.vars ? <Text variant="caption" color="#e02424">{local.vars}</Text> : null}
        </Card>
      ) : null}

      {needs.mediaHeader ? (
        <Input
          label={`${needs.mediaHeader[0]}${needs.mediaHeader.slice(1).toLowerCase()} link (header)`}
          value={mediaUrl}
          onChangeText={setMediaUrl}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://"
          error={err('header_media_url')}
        />
      ) : null}

      <Button title={numbers.length ? `Send to ${numbers.length} ${numbers.length === 1 ? 'number' : 'numbers'}` : 'Send'} loading={send.isPending} onPress={submit} />
    </Screen>
  );
}
