import { useState } from 'react';
import { router } from 'expo-router';
import { DateTimeField } from '@/components/DateTimeField';
import { Banner, Button, Card, Input, Screen, Text } from '@/components/ui';
import { useCreateCampaign, useTemplateNeeds } from '@/features/campaigns/hooks';
import { TemplateSelect } from '@/features/campaigns/TemplateSelect';
import { fieldError } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function CampaignForm() {
  const { spacing } = useTheme();
  const create = useCreateCampaign();
  const [name, setName] = useState('');
  const [template, setTemplate] = useState(null);
  const [when, setWhen] = useState(null);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const needs = useTemplateNeeds(template?.id);

  const err = (key) => local[key] ?? fieldError(error, key);
  const blocked = needs.varCount > 0 || !!needs.mediaHeader;

  function submit() {
    const p = {};
    if (!name.trim()) p.name = 'Give the campaign a name.';
    if (!template) p.template_id = 'Choose a template.';
    if (when && when.getTime() <= Date.now()) p.scheduled_at = 'Pick a time in the future.';
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    create.mutate(
      { name: name.trim(), template_id: template.id, scheduled_at: when ? when.toISOString() : undefined },
      { onSuccess: (res) => router.replace({ pathname: '/campaign/[id]', params: { id: res.campaign.id } }), onError: setError },
    );
  }

  const fields = ['name', 'template_id', 'scheduled_at'];
  const bannerMessage = error && !fields.some((f) => fieldError(error, f)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Banner message={bannerMessage} />
      <Input label="Campaign name" value={name} onChangeText={setName} autoCapitalize="sentences" placeholder="Diwali offer" error={err('name')} />
      <TemplateSelect value={template} onChange={setTemplate} error={err('template_id')} />

      {blocked ? (
        <Banner
          tone="warning"
          message={
            needs.varCount > 0
              ? `This template has ${needs.varCount} variable${needs.varCount > 1 ? 's' : ''}. Campaigns send the template as-is and cannot fill them in, so Meta may reject every message. Use Bulk send for templates with variables.`
              : 'This template has a media header. Campaigns cannot attach the media, so Meta may reject every message. Use Bulk send for templates with a media header.'
          }
        />
      ) : null}

      <Card style={{ marginBottom: spacing.md, gap: spacing.xs }}>
        <Text style={{ fontWeight: '600' }}>Who receives it</Text>
        <Text variant="small" muted>
          All your contacts, except blocked contacts and those who opted out. The list is fixed when you create the campaign, so new contacts added later are not included.
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
