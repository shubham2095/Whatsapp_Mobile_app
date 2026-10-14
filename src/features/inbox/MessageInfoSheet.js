import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Sheet, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const STATUS_TONE = { read: 'success', delivered: 'success', sent: 'neutral', failed: 'danger' };

const stamp = (iso) => (iso ? new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null);

function Step({ icon, label, time, color }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm + 2, opacity: time ? 1 : 0.45 }}>
      <Ionicons name={icon} size={22} color={time ? color : colors.muted} />
      <Text style={{ flex: 1 }}>{label}</Text>
      <Text variant="small" muted>{time ?? 'Not yet'}</Text>
    </View>
  );
}

// WhatsApp-style delivery details for one message.
export function MessageInfoSheet({ message, onClose }) {
  const { colors, spacing } = useTheme();
  const outbound = message?.direction === 'outbound';

  return (
    <Sheet visible={!!message} title="Message info" onClose={onClose}>
      {message ? (
        <>
          <View style={{ backgroundColor: colors.bg, borderRadius: 10, padding: spacing.md, marginBottom: spacing.md }}>
            <Text numberOfLines={4}>{message.body || `[${message.type}]`}</Text>
            {message.sender?.name ? <Text variant="caption" muted style={{ marginTop: 4 }}>Sent by {message.sender.name}</Text> : null}
          </View>

          {outbound ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                <Text variant="small" muted>Status</Text>
                <Badge tone={STATUS_TONE[message.status] ?? 'muted'} label={message.status} />
              </View>
              <Step icon="checkmark" label="Sent" time={stamp(message.sent_at)} color={colors.muted} />
              <Step icon="checkmark-done" label="Delivered" time={stamp(message.delivered_at)} color={colors.muted} />
              <Step icon="checkmark-done" label="Read" time={stamp(message.read_at)} color="#53bdeb" />
              {message.failed_at || message.status === 'failed' ? (
                <>
                  <Step icon="alert-circle" label="Failed" time={stamp(message.failed_at) ?? 'Yes'} color={colors.danger} />
                  {message.error_message ? <Text variant="small" color={colors.danger} style={{ marginTop: 4 }}>{message.error_message}{message.error_code ? ` (code ${message.error_code})` : ''}</Text> : null}
                </>
              ) : null}
            </>
          ) : (
            <Step icon="arrow-down-circle-outline" label="Received" time={stamp(message.created_at)} color={colors.primary} />
          )}
        </>
      ) : null}
    </Sheet>
  );
}
