import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const CHART_HEIGHT = 120;

const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short' });

// Two bars per day: messages we sent (teal) and messages customers sent (orange).
// daily: [{ date: 'YYYY-MM-DD', sent, delivered, read, failed, inbound }]
export function DailyChart({ daily }) {
  const { colors, spacing } = useTheme();
  const rows = daily.map((d) => ({ date: d.date, out: Number(d.sent) + Number(d.delivered) + Number(d.read) + Number(d.failed), inn: Number(d.inbound) }));
  const max = Math.max(1, ...rows.flatMap((r) => [r.out, r.inn]));

  if (rows.length === 0) return <Text muted style={{ textAlign: 'center', padding: spacing.lg }}>No messages in this period.</Text>;

  return (
    <View accessibilityLabel={`Daily messages chart, ${rows.length} days, busiest day ${max} messages`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT, gap: rows.length > 40 ? 1 : 3, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {rows.map((r) => (
          <View key={r.date} style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 1, height: '100%' }}>
            <View style={{ flex: 1, height: `${(r.out / max) * 100}%`, minHeight: r.out ? 2 : 0, backgroundColor: colors.primary, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
            <View style={{ flex: 1, height: `${(r.inn / max) * 100}%`, minHeight: r.inn ? 2 : 0, backgroundColor: colors.accent, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text variant="caption" muted>{shortDate(rows[0].date)}</Text>
        <Text variant="caption" muted>Peak {max}</Text>
        <Text variant="caption" muted>{shortDate(rows[rows.length - 1].date)}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.primary }} />
          <Text variant="caption" muted>Sent by you</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.accent }} />
          <Text variant="caption" muted>Received</Text>
        </View>
      </View>
    </View>
  );
}
