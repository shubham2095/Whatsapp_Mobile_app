import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Banner, Button, Card, CheckList, Input, Screen, Text } from '@/components/ui';
import { useCreateMember, useTeam, useUpdateMember } from '@/features/team/hooks';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

// Add an agent (no `id` param) or edit a member (`id` param).
export default function TeamForm() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const team = useTeam();

  if (team.isLoading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;
  if (team.isError) return <Screen><Banner message={team.error.message} /></Screen>;

  const member = typeof id === 'string' ? team.data.members.find((m) => m.id === id) : undefined;
  if (typeof id === 'string' && !member) return <Screen><Banner message="Team member not found." /></Screen>;
  return <Form member={member} catalog={team.data.features} />;
}

function Form({ member, catalog }) {
  const editing = !!member;
  const isAdmin = member?.role === 'admin';
  const { spacing } = useTheme();
  const create = useCreateMember();
  const update = useUpdateMember();
  const [form, setForm] = useState({ name: member?.name ?? '', email: member?.email ?? '', password: '' });
  const [features, setFeatures] = useState(member?.features ?? []);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);
  const busy = create.isPending || update.isPending;

  function submit() {
    const p = {};
    if (!form.name.trim()) p.name = 'Enter a name.';
    if (!editing && !isValidEmail(form.email)) p.email = 'Enter a valid email address.';
    if (!editing && form.password.length < 8) p.password = 'Use at least 8 characters.';
    if (editing && form.password && form.password.length < 8) p.password = 'Use at least 8 characters, or leave it blank to keep the current one.';
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    const done = { onSuccess: () => router.back(), onError: setError };
    if (editing) {
      // Admins are edited by name/password only: the backend would demote them if role were sent.
      const body = { id: member.id, name: form.name.trim(), password: form.password || undefined };
      if (!isAdmin) Object.assign(body, { role: 'agent', features });
      update.mutate(body, done);
    } else {
      create.mutate({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: 'agent', features }, done);
    }
  }

  const known = ['name', 'email', 'password', 'role', 'features'];
  const bannerMessage = error && !known.some((k) => fieldError(error, k)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: editing ? 'Edit member' : 'Add agent' }} />
      <Banner message={bannerMessage} />
      <Input label="Name" value={form.name} onChangeText={set('name')} autoCapitalize="words" error={err('name')} />
      <Input
        label="Email"
        value={form.email}
        onChangeText={set('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!editing}
        style={editing ? { opacity: 0.6 } : undefined}
        error={err('email')}
      />
      <Input
        label={editing ? 'New password (optional)' : 'Password'}
        password
        value={form.password}
        onChangeText={set('password')}
        autoComplete="new-password"
        error={err('password')}
      />
      {editing ? null : <Text variant="caption" muted style={{ marginTop: -8, marginBottom: spacing.md }}>Share this password with the agent. They can change it after signing in.</Text>}

      {isAdmin ? (
        <Card><Text variant="small" muted>Admins have access to everything, so there are no features to choose.</Text></Card>
      ) : (
        <CheckList label="What this agent can use" items={catalog} value={features} onChange={setFeatures} />
      )}

      <Button title={editing ? 'Save changes' : 'Add agent'} loading={busy} onPress={submit} />
    </Screen>
  );
}
