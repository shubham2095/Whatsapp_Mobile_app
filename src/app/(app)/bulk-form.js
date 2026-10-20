import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, Input, Screen, Text } from '@/components/ui';
import { useSendBulk, useTemplateNeeds, useUploadBulkHeader } from '@/features/campaigns/hooks';
import { TemplateSelect } from '@/features/campaigns/TemplateSelect';
import { pickHeaderFile } from '@/features/inbox/pickMedia';
import { fieldError } from '@/lib/errors';
import { formatFileSize } from '@/lib/format';
import { isDialable, normalizePhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

const MAX_NUMBERS = 1000;

const HEADER_WORDS = {
  IMAGE: { noun: 'image', article: 'an image', formats: 'JPG or PNG' },
  VIDEO: { noun: 'video', article: 'a video', formats: 'MP4' },
  DOCUMENT: { noun: 'document', article: 'a document', formats: 'PDF' },
};

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
  const { colors, spacing } = useTheme();
  const send = useSendBulk();
  const upload = useUploadBulkHeader();
  // Contacts can open this screen with their numbers already filled in.
  const params = useLocalSearchParams();
  const [text, setText] = useState(typeof params.numbers === 'string' ? params.numbers : '');
  const [template, setTemplate] = useState(null);
  const [vars, setVars] = useState({});
  const [mediaUrl, setMediaUrl] = useState('');
  const [headerFile, setHeaderFile] = useState(null); // a file picked from the phone, uploaded when you send
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const needs = useTemplateNeeds(template?.id);

  const { numbers, invalid } = useMemo(() => parseNumbers(text), [text]);
  const err = (key) => local[key] ?? fieldError(error, key);
  const words = needs.mediaHeader ? HEADER_WORDS[needs.mediaHeader] : null;

  function pickTemplate(t) {
    setTemplate(t);
    setVars({});
    setMediaUrl('');
    setHeaderFile(null);
  }

  async function chooseHeader() {
    const result = await pickHeaderFile(needs.mediaHeader);
    if (!result) return;
    if (result.error) {
      setLocal((l) => ({ ...l, header_media_url: result.error }));
    } else {
      setLocal((l) => ({ ...l, header_media_url: undefined }));
      setHeaderFile(result.file);
    }
  }

  async function sendNow(values) {
    try {
      // A file from the phone is uploaded to WhatsApp first; its id then goes along with the message.
      const media = needs.mediaHeader && headerFile ? await upload.mutateAsync(headerFile) : null;
      const res = await send.mutateAsync({
        numbers,
        template: template.name,
        language: template.language,
        variables: values.length ? values : undefined,
        header_media_id: media?.media_id,
        header_media_url: needs.mediaHeader && !media ? mediaUrl.trim() : undefined,
      });
      router.replace({ pathname: '/bulk/[id]', params: { id: res.bulk_send.uuid } });
    } catch (e) {
      setError(e);
    }
  }

  function submit() {
    const p = {};
    if (numbers.length === 0) p.numbers = 'Add at least one valid mobile number.';
    if (numbers.length > MAX_NUMBERS) p.numbers = `You can send to ${MAX_NUMBERS} numbers at a time.`;
    if (!template) p.template = 'Choose a template.';
    const values = Array.from({ length: needs.varCount }, (_, i) => (vars[i + 1] ?? '').trim());
    if (values.some((v) => !v)) p.vars = 'Fill in every template variable.';
    if (needs.mediaHeader && !headerFile && !/^https?:\/\//i.test(mediaUrl.trim())) {
      p.header_media_url = `Choose the ${words.noun} from your phone, or paste a public https link.`;
    }
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    Alert.alert('Send bulk message', `Send "${template.name}" to ${numbers.length} number${numbers.length > 1 ? 's' : ''}? Messages cannot be recalled once sent. Blocked numbers on your black list are skipped automatically.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send now', onPress: () => sendNow(values) },
    ]);
  }

  const fields = ['numbers', 'template', 'header_media_url', 'file'];
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
          {local.vars ? <Text variant="caption" color={colors.danger}>{local.vars}</Text> : null}
        </Card>
      ) : null}

      {words ? (
        <Card style={{ marginBottom: spacing.md, gap: spacing.sm }}>
          <Text variant="small" muted>
            This template has {words.article} header. {words.formats}, up to 16 MB.
          </Text>
          {headerFile ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="attach" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} variant="small" style={{ fontWeight: '600' }}>{headerFile.name}</Text>
                {headerFile.size ? <Text variant="caption" muted>{formatFileSize(headerFile.size)}</Text> : null}
              </View>
              <Pressable onPress={() => setHeaderFile(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove file">
                <Ionicons name="close-circle" size={22} color={colors.muted} />
              </Pressable>
            </View>
          ) : (
            <>
              <Button title={`Choose ${words.noun} from phone`} icon="cloud-upload-outline" variant="soft" size="sm" onPress={chooseHeader} />
              <Input
                label="or paste a public link"
                value={mediaUrl}
                onChangeText={setMediaUrl}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://"
              />
            </>
          )}
          {err('header_media_url') || err('file') ? <Text variant="caption" color={colors.danger}>{err('header_media_url') || err('file')}</Text> : null}
        </Card>
      ) : null}

      <Button title={numbers.length ? `Send to ${numbers.length} ${numbers.length === 1 ? 'number' : 'numbers'}` : 'Send'} loading={send.isPending || upload.isPending} onPress={submit} />
    </Screen>
  );
}
