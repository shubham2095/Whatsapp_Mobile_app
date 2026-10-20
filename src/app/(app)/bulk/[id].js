import { ActivityIndicator, Alert, FlatList, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Badge, Banner, Button, Card, ProgressBar, Text } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { STATUS_TONE } from '@/features/campaigns/meta';
import { useBulkSend, useRetryBulk } from '@/features/campaigns/hooks';
import { haptics } from '@/lib/haptics';
import { formatListTime } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

export default function BulkDetail() {
  const { id } = useLocalSearchParams();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch } = useBulkSend(id);
  const retry = useRetryBulk(id);
  const toast = useToast();

  function confirmRetry() {
    Alert.alert('Send again', 'Only the numbers that failed get the message again, with the same template and values.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send again',
        onPress: () => {
          haptics.tap();
          retry.mutate(undefined, { onSuccess: () => toast.show('Sending the failed numbers again') });
        },
      },
    ]);
  }

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </View>
    );
  }

  const send = data.bulk_send;
  const recipients = send.recipients ?? [];
  const pending = Math.max(0, send.total - send.sent_count - send.failed_count);

  const header = (
    <View style={{ gap: spacing.md, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="heading" style={{ flex: 1, fontFamily: 'monospace' }} numberOfLines={1}>{send.template_name}</Text>
        <Badge tone={STATUS_TONE[send.status] ?? 'muted'} label={send.status} />
      </View>
      <Text variant="small" muted>
        {send.language}{send.phone_number ? ` · from ${send.phone_number.display_phone_number}` : ''} · {formatListTime(send.created_at)}
      </Text>
      {send.status === 'processing' ? <Banner tone="info" message="Sending in progress. This screen updates by itself and you can leave it." /> : null}
      <Card style={{ gap: spacing.sm }}>
        <ProgressBar value={send.sent_count + send.failed_count} total={send.total} />
        <View style={{ flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' }}>
          <Text variant="small">Total {send.total}</Text>
          <Text variant="small" color={colors.success}>Sent {send.sent_count}</Text>
          {send.failed_count > 0 ? <Text variant="small" color={colors.danger}>Failed {send.failed_count}</Text> : null}
          {pending > 0 ? <Text variant="small" muted>Waiting {pending}</Text> : null}
        </View>
      </Card>
      {send.failed_count > 0 && send.status !== 'processing' ? (
        <Button
          title={`Send again to ${send.failed_count} failed ${send.failed_count === 1 ? 'number' : 'numbers'}`}
          icon="refresh"
          variant="outline"
          loading={retry.isPending}
          onPress={confirmRetry}
        />
      ) : null}
      {retry.isError ? <Banner message={retry.error.message} /> : null}
      <Text variant="subheading">Numbers</Text>
    </View>
  );

  return (
    <FlatList
      data={recipients}
      keyExtractor={(r) => String(r.id)}
      ListHeaderComponent={header}
      ListFooterComponent={<View style={{ height: spacing.xl }} />}
      renderItem={({ item }) => (
        <View style={{ paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ flex: 1, fontWeight: '600' }}>{displayPhone(item.phone)}</Text>
            <Badge tone={item.status === 'failed' ? 'danger' : STATUS_TONE[item.status] ?? 'muted'} label={item.status} />
          </View>
          {item.error_message ? <Text variant="caption" color={colors.danger}>{item.error_message}</Text> : null}
        </View>
      )}
    />
  );
}
