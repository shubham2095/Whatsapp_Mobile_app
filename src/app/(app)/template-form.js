import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, ChipSelect, Input, Screen, Text } from '@/components/ui';
import { pickHeaderFile } from '@/features/inbox/pickMedia';
import { useCreateTemplate, useUploadTemplateSample } from '@/features/templates/hooks';
import { BUTTON_TYPES, HEADER_FORMATS, LANGUAGES, variableNumbers, variablesAreSequential } from '@/features/templates/meta';
import { TemplatePreview } from '@/features/templates/TemplatePreview';
import { fieldError } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
];
const HEADERS = HEADER_FORMATS.map((f) => ({ value: f, label: f === 'NONE' ? 'None' : f[0] + f.slice(1).toLowerCase() }));
const LANGS = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));
const BTN_OPTIONS = BUTTON_TYPES.map((b) => ({ value: b.value, label: b.label }));

// Meta's review sample for a media header: the server accepts JPG, PNG, MP4 and PDF up to 5 MB.
const MAX_SAMPLE_BYTES = 5 * 1024 * 1024;
const MEDIA_WORDS = {
  IMAGE: { noun: 'image', formats: 'JPG or PNG' },
  VIDEO: { noun: 'video', formats: 'MP4' },
  DOCUMENT: { noun: 'document', formats: 'PDF' },
};

// Names must be lowercase letters, digits and underscores (Meta rule, enforced by the backend).
const cleanName = (v) => v.toLowerCase().replace(/[^a-z0-9_]+/g, '_');

export default function TemplateForm() {
  const { colors, spacing } = useTheme();
  const create = useCreateTemplate();
  const [f, setF] = useState({
    name: '',
    category: 'UTILITY',
    language: 'en',
    header_format: 'NONE',
    header_text: '',
    body: 'Hi {{1}}, thanks for choosing us! Your order {{2}} is confirmed.',
    examples: {}, // { 1: 'Rahul', 2: 'ORD-1001' }
    footer: '',
    buttons: [],
  });
  const [error, setError] = useState(null);
  const [problems, setProblems] = useState({});
  const [sample, setSample] = useState(null); // a sample file for a media header, uploaded to Meta when you submit
  const upload = useUploadTemplateSample();
  const mediaWords = MEDIA_WORDS[f.header_format] ?? null;

  const set = (key) => (value) => setF((s) => ({ ...s, [key]: value }));
  const changeHeader = (value) => {
    setSample(null); // a sample only fits the header type it was picked for
    set('header_format')(value);
  };

  async function chooseSample() {
    const result = await pickHeaderFile(f.header_format, { maxBytes: MAX_SAMPLE_BYTES });
    if (!result) return;
    if (result.error) {
      setProblems((p) => ({ ...p, sample: result.error }));
    } else {
      setProblems((p) => ({ ...p, sample: undefined }));
      setSample(result.file);
    }
  }
  const err = (key) => problems[key] ?? fieldError(error, key);

  const vars = variableNumbers(f.body);
  const setExample = (n, v) => setF((s) => ({ ...s, examples: { ...s.examples, [n]: v } }));
  const addVariable = () => set('body')(`${f.body}{{${(vars[vars.length - 1] ?? 0) + 1}}}`);

  const addButton = (type) => {
    if (f.buttons.length >= 10) return;
    setF((s) => ({ ...s, buttons: [...s.buttons, { type, text: '' }] }));
  };
  const patchButton = (i, patch) => setF((s) => ({ ...s, buttons: s.buttons.map((b, j) => (j === i ? { ...b, ...patch } : b)) }));
  const removeButton = (i) => setF((s) => ({ ...s, buttons: s.buttons.filter((_, j) => j !== i) }));

  async function send(name) {
    try {
      // The sample goes to Meta first; the handle it returns is what the template is created with.
      const handle = mediaWords ? (await upload.mutateAsync(sample)).header_handle : undefined;
      const res = await create.mutateAsync({
        name,
        language: f.language,
        category: f.category,
        header_format: f.header_format,
        header_text: f.header_format === 'TEXT' ? f.header_text.trim() : undefined,
        header_handle: handle,
        body: f.body,
        body_example: vars.length ? vars.map((n) => f.examples[n].trim()) : undefined,
        footer: f.footer.trim() || undefined,
        buttons: f.buttons.length
          ? f.buttons.map((b) => ({ type: b.type, text: b.text.trim(), url: b.url?.trim(), phone_number: b.phone_number?.trim(), example: b.example?.trim() }))
          : undefined,
      });
      Alert.alert('Template submitted', res.message);
      router.back();
    } catch (e) {
      setError(e);
    }
  }

  function submit() {
    const p = {};
    const name = cleanName(f.name.trim());
    if (!name) p.name = 'Enter a template name (letters, numbers and underscores).';
    if (!f.body.trim()) p.body = 'Enter the message body.';
    if (mediaWords && !sample) p.sample = `Choose a sample ${mediaWords.noun} for Meta to review.`;
    if (f.header_format === 'TEXT' && !f.header_text.trim()) p.header_text = 'Enter the header text or choose another header type.';
    if (vars.length && !variablesAreSequential(vars)) p.body = 'Variables must be numbered {{1}}, {{2}}, {{3}} with no gaps.';
    else if (vars.some((n) => !(f.examples[n] ?? '').trim())) p.examples = 'Meta needs a sample value for every variable.';
    f.buttons.forEach((b, i) => {
      if (!b.text.trim()) p[`button_${i}`] = 'Enter the button text.';
      else if (b.type === 'URL' && !/^https?:\/\//i.test(b.url ?? '')) p[`button_${i}`] = 'Enter a full URL starting with https://';
      else if (b.type === 'PHONE_NUMBER' && !(b.phone_number ?? '').trim()) p[`button_${i}`] = 'Enter the phone number to call (with country code).';
    });
    setProblems(p);
    setError(null);
    if (Object.keys(p).length) return;

    send(name);
  }

  const known = ['name', 'category', 'language', 'header_format', 'header_text', 'header_handle', 'body', 'body_example', 'footer'];
  const bannerMessage = error && !known.some((k) => fieldError(error, k)) ? error.message : null;
  const samples = Object.fromEntries(Object.entries(f.examples).map(([k, v]) => [k, v]));

  return (
    <Screen scroll edges={['bottom']}>
      <Banner message={bannerMessage} />
      <Text variant="small" muted style={{ marginBottom: spacing.md }}>
        Your template is sent to Meta for review. Approval usually takes a few minutes to 24 hours.
      </Text>

      <Input label="Template name" value={f.name} onChangeText={(v) => set('name')(cleanName(v))} autoCapitalize="none" autoCorrect={false} placeholder="order_confirmation" error={err('name')} />
      <ChipSelect label="Category" options={CATEGORIES} value={f.category} onChange={set('category')} />
      <ChipSelect label="Language" options={LANGS} value={f.language} onChange={set('language')} />
      <ChipSelect label="Header" options={HEADERS} value={f.header_format} onChange={changeHeader} />
      {f.header_format === 'TEXT' ? <Input label="Header text" value={f.header_text} onChangeText={set('header_text')} maxLength={60} error={err('header_text')} /> : null}
      {mediaWords ? (
        <Card style={{ marginBottom: spacing.md, gap: spacing.sm }}>
          <Text variant="small" muted>
            Meta needs a sample {mediaWords.noun} to review. {mediaWords.formats}, up to 5 MB. You pick the real {mediaWords.noun} each time you send this template.
          </Text>
          {sample ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="attach" size={20} color={colors.primary} />
              <Text numberOfLines={1} variant="small" style={{ flex: 1, fontWeight: '600' }}>{sample.name}</Text>
              <Pressable onPress={() => setSample(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove sample">
                <Ionicons name="close-circle" size={22} color={colors.muted} />
              </Pressable>
            </View>
          ) : (
            <Button title={`Choose sample ${mediaWords.noun}`} icon="cloud-upload-outline" variant="soft" size="sm" onPress={chooseSample} />
          )}
          {err('header_handle') || err('sample') ? <Text variant="caption" color={colors.danger}>{err('header_handle') || err('sample')}</Text> : null}
        </Card>
      ) : null}

      <Input label="Message body" value={f.body} onChangeText={set('body')} multiline maxLength={1024} style={{ minHeight: 110, textAlignVertical: 'top' }} error={err('body')} />
      <Button title="Add variable" variant="outline" onPress={addVariable} style={{ marginTop: -4, marginBottom: spacing.md }} />

      {vars.length > 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="small" muted style={{ marginBottom: spacing.sm }}>Sample values (Meta uses these to review your template)</Text>
          {vars.map((n) => (
            <Input key={n} label={`{{${n}}}`} value={f.examples[n] ?? ''} onChangeText={(v) => setExample(n, v)} placeholder="e.g. Rahul" />
          ))}
          {problems.examples ? <Text variant="caption" color={colors.danger}>{problems.examples}</Text> : null}
        </Card>
      ) : null}

      <Input label="Footer (optional)" value={f.footer} onChangeText={set('footer')} maxLength={60} />

      <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>Buttons (optional, up to 10)</Text>
      {f.buttons.map((b, i) => (
        <Card key={i} style={{ marginBottom: spacing.sm, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="small" color={colors.primary} style={{ flex: 1, fontWeight: '700' }}>{BUTTON_TYPES.find((t) => t.value === b.type)?.label}</Text>
            <Pressable onPress={() => removeButton(i)} hitSlop={10} accessibilityLabel="Remove button">
              <Ionicons name="trash-outline" size={20} color={colors.muted} />
            </Pressable>
          </View>
          <Input label="Button text" value={b.text} onChangeText={(v) => patchButton(i, { text: v })} maxLength={25} error={problems[`button_${i}`]} />
          {b.type === 'URL' ? <Input label="Website URL" value={b.url ?? ''} onChangeText={(v) => patchButton(i, { url: v })} autoCapitalize="none" keyboardType="url" placeholder="https://" /> : null}
          {b.type === 'PHONE_NUMBER' ? <Input label="Phone number" value={b.phone_number ?? ''} onChangeText={(v) => patchButton(i, { phone_number: v })} keyboardType="phone-pad" placeholder="+919876543210" /> : null}
          {b.type === 'COPY_CODE' ? <Input label="Example code" value={b.example ?? ''} onChangeText={(v) => patchButton(i, { example: v })} autoCapitalize="characters" placeholder="SAVE20" /> : null}
        </Card>
      ))}
      <ChipSelect options={BTN_OPTIONS} value={null} onChange={addButton} />

      <Text variant="small" muted style={{ marginBottom: spacing.sm, fontWeight: '600' }}>Preview</Text>
      <View style={{ marginBottom: spacing.lg }}>
        <TemplatePreview
          header={{ format: f.header_format, text: f.header_text }}
          body={f.body}
          footer={f.footer}
          buttons={f.buttons}
          samples={samples}
        />
      </View>

      <Button title="Submit to Meta" loading={create.isPending || upload.isPending} onPress={submit} />
    </Screen>
  );
}
