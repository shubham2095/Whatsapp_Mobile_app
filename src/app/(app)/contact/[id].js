import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listConversations } from '@/api/inbox';
import { Avatar, Badge, Banner, Button, Card, Screen, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { contactTitle, priorityOf, tagsOf } from '@/features/contacts/ContactRow';
import { useAddToBlacklist, useContact, useDeleteContact, useUpdateContact } from '@/features/contacts/hooks';
import { formatListTime, timeAgo } from '@/lib/format';
import { can } from '@/lib/permissions';
import { displayPhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

function Info({ label, value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 }}>
      <Text muted variant="small">{label}</Text>
      <Text variant="small" style={{ flexShrink: 1, textAlign: 'right' }} selectable>{value}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress, loading = false }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.chipBg, opacity: pressed || loading ? 0.6 : 1 })}
    >
      {loading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name={icon} size={22} color={colors.primary} />}
      <Text variant="caption" color={colors.primary} style={{ fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export default function ContactDetail() {
  const { id } = useLocalSearchParams();
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch } = useContact(id);
  const update = useUpdateContact(id);
  const remove = useDeleteContact();
  const blacklist = useAddToBlacklist();
  const [finding, setFinding] = useState(false);
  const [notice, setNotice] = useState(null);

  const contact = data?.contact;
  const canUpdate = can(user, 'contacts.update');
  const canDelete = can(user, 'contacts.delete');
  const canChat = can(user, 'conversations.view');

  async function openChat() {
    setFinding(true);
    setNotice(null);
    try {
      const res = await listConversations({ search: contact.wa_id, perPage: 10 });
      const chat = res.conversations.find((c) => c.contact?.id === contact.id) ?? res.conversations[0];
      if (!chat) {
        setNotice({ tone: 'info', text: 'No chat with this contact yet. Reach out with a template from Campaigns or Bulk send.' });
        return;
      }
      router.push({
        pathname: '/chat/[id]',
        params: { id: chat.id, name: contactTitle(contact), phone: displayPhone(contact.wa_id), windowOpen: String(chat.window_open) },
      });
    } catch (e) {
      setNotice({ tone: 'danger', text: e.message });
    } finally {
      setFinding(false);
    }
  }

  function toggle(field, label, on) {
    update.mutate({ [field]: !on }, { onError: (e) => Alert.alert(`Could not update ${label}`, e.message) });
  }

  function confirmDelete() {
    Alert.alert('Delete contact', `Remove ${contactTitle(contact)} from your contacts? Their chats stay in the inbox.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(contact.id, { onSuccess: () => router.back(), onError: (e) => Alert.alert('Could not delete', e.message) }),
      },
    ]);
  }

  function confirmBlacklist() {
    Alert.alert('Add to black list', `${displayPhone(contact.wa_id)} will be excluded from every campaign and bulk send.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: () =>
          blacklist.mutate(
            { phone: contact.wa_id, name: contact.name || undefined, reason: 'Added from contact' },
            { onSuccess: () => setNotice({ tone: 'success', text: 'Added to the black list.' }), onError: (e) => Alert.alert('Could not add', e.message) },
          ),
      },
    ]);
  }

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <Screen>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </Screen>
    );
  }

  const tags = tagsOf(contact).filter((t) => t.toLowerCase() !== 'hot');
  const priority = priorityOf(contact.hot_score);

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: 'Contact' }} />
      <View style={{ gap: spacing.md }}>
        <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md }}>
          <Avatar name={contactTitle(contact)} size={72} />
          <Text variant="heading" style={{ textAlign: 'center' }}>{contactTitle(contact)}</Text>
          {contact.name ? <Text muted>{displayPhone(contact.wa_id)}</Text> : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
            {contact.is_hot ? <Badge tone="accent" label="Hot lead" /> : null}
            {contact.is_blocked ? <Badge tone="danger" label="Blocked" /> : null}
            {contact.opted_out ? <Badge tone="warning" label="Opted out" /> : null}
          </View>
        </View>

        <Banner tone={notice?.tone} message={notice?.text} />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {canChat ? <ActionButton icon="chatbubble-ellipses-outline" label="Message" onPress={openChat} loading={finding} /> : null}
          <ActionButton icon="call-outline" label="Call" onPress={() => Linking.openURL(`tel:+${contact.wa_id}`)} />
          {canUpdate ? <ActionButton icon="create-outline" label="Edit" onPress={() => router.push({ pathname: '/contact-form', params: { id: contact.id } })} /> : null}
        </View>

        {contact.is_hot ? (
          <Card style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="flame" size={18} color={colors.accent} />
              <Text style={{ fontWeight: '700', flex: 1 }}>AI priority</Text>
              <Badge tone={priority.tone} label={`${priority.label} · ${contact.hot_score ?? 50}/100`} />
            </View>
            {contact.hot_reason ? <Text variant="small">{contact.hot_reason}</Text> : null}
            {contact.hot_at ? <Text variant="caption" muted>Flagged {timeAgo(contact.hot_at)}</Text> : null}
          </Card>
        ) : null}

        <Card>
          <Info label="Email" value={contact.email} />
          <Info label="Company" value={contact.company} />
          <Info label="Source" value={contact.source} />
          <Info label="Language" value={contact.language} />
          <Info label="Country" value={contact.country} />
          <Info label="Assigned to" value={contact.assigned_agent?.name} />
          <Info label="Last interaction" value={contact.last_interaction_at ? formatListTime(contact.last_interaction_at) : null} />
          <Info label="Chats" value={contact.conversations_count != null ? String(contact.conversations_count) : null} />
          <Info label="Added" value={contact.created_at ? new Date(contact.created_at).toLocaleDateString() : null} />
        </Card>

        {tags.length > 0 ? (
          <Card style={{ gap: spacing.sm }}>
            <Text variant="small" muted>Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {tags.map((t) => <Badge key={t} label={t} />)}
            </View>
          </Card>
        ) : null}

        {canUpdate ? (
          <Card style={{ gap: spacing.sm }}>
            <Button
              title={contact.is_blocked ? 'Unblock contact' : 'Block contact'}
              variant="outline"
              loading={update.isPending && update.variables?.is_blocked !== undefined}
              onPress={() => toggle('is_blocked', 'block status', contact.is_blocked)}
            />
            <Button
              title={contact.opted_out ? 'Mark as opted in' : 'Mark as opted out'}
              variant="outline"
              loading={update.isPending && update.variables?.opted_out !== undefined}
              onPress={() => toggle('opted_out', 'opt-out status', contact.opted_out)}
            />
          </Card>
        ) : null}

        {canDelete ? (
          <View style={{ gap: spacing.sm }}>
            <Button title="Add to black list" variant="outline" loading={blacklist.isPending} onPress={confirmBlacklist} />
            <Button title="Delete contact" variant="danger" loading={remove.isPending} onPress={confirmDelete} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
