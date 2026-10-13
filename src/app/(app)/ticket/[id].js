import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Badge, Banner, Button, Card, ChipSelect, Input, Screen, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { PRIORITY_TONE, STATUSES, STATUS_TONE, statusLabel } from '@/features/support/meta';
import { useReplyToTicket, useTicket } from '@/features/support/hooks';
import { fieldError } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function TicketDetail() {
  const { id } = useLocalSearchParams();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch } = useTicket(id);

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <Screen>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </Screen>
    );
  }
  return <Ticket ticket={data.ticket} />;
}

function Ticket({ ticket }) {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const reply = useReplyToTicket();
  const [text, setText] = useState('');
  const [status, setStatus] = useState(ticket.status === 'open' ? 'in_progress' : ticket.status);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [local, setLocal] = useState(null);

  function send() {
    setError(null);
    setSent(false);
    if (!text.trim()) {
      setLocal('Write a reply first.');
      return;
    }
    setLocal(null);
    reply.mutate(
      { id: ticket.id, admin_reply: text.trim(), status },
      {
        onSuccess: () => {
          setText('');
          setSent(true);
        },
        onError: setError,
      },
    );
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Text variant="small" muted style={{ fontFamily: 'monospace' }}>{ticket.ticket_id}</Text>
          <Badge tone={STATUS_TONE[ticket.status] ?? 'muted'} label={statusLabel(ticket.status)} />
          <Badge tone={PRIORITY_TONE[ticket.priority] ?? 'muted'} label={ticket.priority} />
          {ticket.category ? <Badge label={ticket.category} /> : null}
        </View>

        <Text variant="heading">{ticket.subject}</Text>
        <Text variant="small" muted>
          {ticket.user_name} · {new Date(ticket.created_at).toLocaleString()}
        </Text>

        <Card><Text selectable>{ticket.description}</Text></Card>

        {ticket.admin_reply ? (
          <Card style={{ gap: spacing.xs, borderColor: colors.primary }}>
            <Text variant="small" color={colors.primary} style={{ fontWeight: '700' }}>Reply from Heltog support</Text>
            <Text selectable>{ticket.admin_reply}</Text>
            {ticket.replied_at ? <Text variant="caption" muted>{new Date(ticket.replied_at).toLocaleString()}</Text> : null}
          </Card>
        ) : (
          <Banner tone="info" message="No reply yet. We will answer here and the status will change." />
        )}

        {user.is_super_admin ? (
          <Card style={{ gap: spacing.sm }}>
            <Text style={{ fontWeight: '700' }}>Reply</Text>
            <Banner message={error?.message && !fieldError(error, 'admin_reply') ? error.message : null} />
            <Banner tone="success" message={sent ? 'Reply sent.' : null} />
            <Input value={text} onChangeText={setText} multiline maxLength={5000} placeholder="Type your reply" style={{ minHeight: 100, textAlignVertical: 'top' }} error={local ?? fieldError(error, 'admin_reply')} />
            <ChipSelect label="Set status" options={STATUSES} value={status} onChange={setStatus} />
            <Button title="Send reply" loading={reply.isPending} onPress={send} />
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
