import { useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Banner, Button, ChipSelect, Input, Screen } from '@/components/ui';
import { CATEGORIES, PRIORITIES } from '@/features/support/meta';
import { useCreateTicket } from '@/features/support/hooks';
import { fieldError } from '@/lib/errors';

export default function SupportForm() {
  const create = useCreateTicket();
  // Other screens can prefill the ticket (e.g. an account deletion request).
  const params = useLocalSearchParams();
  const [form, setForm] = useState({
    subject: typeof params.subject === 'string' ? params.subject : '',
    description: typeof params.description === 'string' ? params.description : '',
    priority: 'medium',
    category: typeof params.category === 'string' ? params.category : null,
  });
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);

  function submit() {
    const p = {};
    if (!form.subject.trim()) p.subject = 'Give your question a short title.';
    if (form.description.trim().length < 10) p.description = 'Describe the problem in a few words so we can help.';
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    create.mutate(
      { subject: form.subject.trim(), description: form.description.trim(), priority: form.priority, category: form.category ?? undefined },
      {
        onSuccess: (res) => {
          Alert.alert('Ticket created', `Your ticket ${res.ticket.ticket_id} has been sent to the Heltog team.`);
          router.replace({ pathname: '/ticket/[id]', params: { id: res.ticket.id } });
        },
        onError: setError,
      },
    );
  }

  const known = ['subject', 'description', 'priority', 'category'];
  const bannerMessage = error && !known.some((k) => fieldError(error, k)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Banner message={bannerMessage} />
      <Input label="Subject" value={form.subject} onChangeText={set('subject')} maxLength={255} error={err('subject')} />
      <Input
        label="What do you need help with?"
        value={form.description}
        onChangeText={set('description')}
        multiline
        maxLength={5000}
        style={{ minHeight: 140, textAlignVertical: 'top' }}
        error={err('description')}
      />
      <ChipSelect label="Priority" options={PRIORITIES} value={form.priority} onChange={set('priority')} />
      <ChipSelect label="Category (optional)" options={CATEGORIES} value={form.category} onChange={(v) => set('category')(form.category === v ? null : v)} />
      <Button title="Submit ticket" loading={create.isPending} onPress={submit} />
    </Screen>
  );
}
