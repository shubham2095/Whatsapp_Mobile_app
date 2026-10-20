import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { DateTimeField } from '@/components/DateTimeField';
import { Banner, Button, Card, ChipSelect, Input, Screen, Text } from '@/components/ui';
import { useTagNames } from '@/features/contacts/hooks';
import { useCreateCampaign, useTemplateNeeds } from '@/features/campaigns/hooks';
import { TemplateSelect } from '@/features/campaigns/TemplateSelect';
import { fieldError } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

// The server filters contacts by where they came from (contacts.source) and, with the campaign-tags backend patch,
// by tag (docs/backend-campaign-tags-variables.md).
const AUDIENCES = [
  { value: 'all', label: 'Everyone', hint: 'All your contacts.' },
  { value: 'manual', label: 'Added by hand', hint: 'Only contacts you added yourself.' },
  { value: 'import', label: 'Imported', hint: 'Only contacts you imported from a file or your phone.' },
  { value: 'inbound', label: 'Messaged us', hint: 'Only people who started a chat with you.' },
];

// Wrapping chips to pick any number of tags.
function TagPicker({ tags, picked, onToggle }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {tags.map((t) => {
        const on = picked.includes(t.name);
        return (
          <Pressable
            key={t.name}
            onPress={() => onToggle(t.name)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: on ? colors.primary : colors.chipBg }}
          >
            <Text variant="small" style={{ color: on ? '#fff' : colors.primary, fontWeight: '600' }}>
              {t.name} ({t.contacts_count})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CampaignForm() {
  const { colors, spacing } = useTheme();
  const create = useCreateCampaign();
  const [name, setName] = useState('');
  const [template, setTemplate] = useState(null);
  const [when, setWhen] = useState(null);
  const [audience, setAudience] = useState('all');
  const [pickedTags, setPickedTags] = useState([]);
  const [vars, setVars] = useState({});
  const [mediaUrl, setMediaUrl] = useState('');
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const needs = useTemplateNeeds(template?.id);
  // One request tells whether the server has the campaign-tags patch: tags, variables and a header link need it.
  const tagNames = useTagNames();
  const upgraded = tagNames.isSuccess;
  const tags = tagNames.data ?? [];

  const err = (key) => local[key] ?? fieldError(error, key);
  // Without the patch the server sends the template as it is, so variables and media cannot be filled in.
  const blocked = !upgraded && (needs.varCount > 0 || !!needs.mediaHeader);

  function pickTemplate(t) {
    setTemplate(t);
    setVars({});
    setMediaUrl('');
  }

  const toggleTag = (tag) => setPickedTags((list) => (list.includes(tag) ? list.filter((x) => x !== tag) : [...list, tag]));

  function submit() {
    const p = {};
    if (!name.trim()) p.name = 'Give the campaign a name.';
    if (!template) p.template_id = 'Choose a template.';
    if (when && when.getTime() <= Date.now()) p.scheduled_at = 'Pick a time in the future.';
    const values = Array.from({ length: upgraded ? needs.varCount : 0 }, (_, i) => (vars[i + 1] ?? '').trim());
    if (values.some((v) => !v)) p.vars = 'Fill in every template variable.';
    if (upgraded && needs.mediaHeader && !/^https?:\/\//i.test(mediaUrl.trim())) {
      p.header_media_url = `Paste a public https link to the ${needs.mediaHeader.toLowerCase()}.`;
    }
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    // variable_mapping: { "1": "Hi {first_name}", "2": "Diwali", header_media_url } (see the backend doc).
    const mapping = {};
    values.forEach((v, i) => {
      mapping[i + 1] = v;
    });
    if (upgraded && needs.mediaHeader) mapping.header_media_url = mediaUrl.trim();

    const filter = {};
    if (audience !== 'all') filter.source = audience;
    if (upgraded && pickedTags.length) filter.tags = pickedTags;

    create.mutate(
      {
        name: name.trim(),
        template_id: template.id,
        audience_filter: Object.keys(filter).length ? filter : undefined,
        variable_mapping: Object.keys(mapping).length ? mapping : undefined,
        scheduled_at: when ? when.toISOString() : undefined,
      },
      { onSuccess: (res) => router.replace({ pathname: '/campaign/[id]', params: { id: res.campaign.id } }), onError: setError },
    );
  }

  const fields = ['name', 'template_id', 'scheduled_at'];
  const bannerMessage = error && !fields.some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Banner message={bannerMessage} />
      <Input label="Campaign name" value={name} onChangeText={setName} autoCapitalize="sentences" placeholder="Diwali offer" error={err('name')} />
      <TemplateSelect value={template} onChange={pickTemplate} error={err('template_id')} />

      {blocked ? (
        <Banner
          tone="warning"
          message={
            needs.varCount > 0
              ? `This template has ${needs.varCount} variable${needs.varCount > 1 ? 's' : ''}. This server sends campaigns without filling them in, so Meta may reject every message. Use Bulk send for templates with variables.`
              : 'This template has a media header. This server sends campaigns without the media, so Meta may reject every message. Use Bulk send for templates with a media header.'
          }
        />
      ) : null}

      {upgraded && needs.varCount > 0 ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="small" muted style={{ marginBottom: spacing.sm }}>
            Template variables. Each person gets their own value when you write {'{first_name}'}, {'{name}'}, {'{company}'} or {'{phone}'}; other text is the same for everyone.
          </Text>
          {Array.from({ length: needs.varCount }, (_, i) => (
            <Input
              key={i}
              label={`{{${i + 1}}}`}
              value={vars[i + 1] ?? ''}
              onChangeText={(v) => setVars((s) => ({ ...s, [i + 1]: v }))}
              placeholder={i === 0 ? '{first_name}' : 'Diwali offer'}
              autoCapitalize="none"
            />
          ))}
          {local.vars ? <Text variant="caption" color={colors.danger}>{local.vars}</Text> : null}
        </Card>
      ) : null}

      {upgraded && needs.mediaHeader ? (
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

      <Card style={{ marginBottom: spacing.md, gap: spacing.sm }}>
        <Text style={{ fontWeight: '600' }}>Who receives it</Text>
        <ChipSelect options={AUDIENCES} value={audience} onChange={setAudience} />
        {upgraded && tags.length > 0 ? (
          <>
            <Text variant="small" muted>Only contacts with one of these tags (optional):</Text>
            <TagPicker tags={tags} picked={pickedTags} onToggle={toggleTag} />
          </>
        ) : null}
        <Text variant="small" muted>
          {AUDIENCES.find((a) => a.value === audience).hint}
          {upgraded && pickedTags.length ? ` Tagged ${pickedTags.join(' or ')}.` : ''} Blocked contacts and those who opted out are always left out. The list is fixed when you create the campaign, so new contacts added later are not included.
        </Text>
      </Card>

      <DateTimeField label="Schedule (optional)" value={when} onChange={setWhen} />
      {local.scheduled_at || fieldError(error, 'scheduled_at') ? <Text variant="caption" color="#e02424" style={{ marginTop: -8, marginBottom: 12 }}>{err('scheduled_at')}</Text> : null}

      <Button title={when ? 'Create scheduled campaign' : 'Create draft'} loading={create.isPending} onPress={submit} />
      <Text variant="caption" muted style={{ marginTop: spacing.sm, textAlign: 'center' }}>
        You can review the recipients and start it from the next screen.
      </Text>
    </Screen>
  );
}
