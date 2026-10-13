import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, Text } from '@/components/ui';
import { displayPhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

const QUALITY = {
  GREEN: { label: 'Quality: High', tone: 'success' },
  YELLOW: { label: 'Quality: Medium', tone: 'warning' },
  RED: { label: 'Quality: Low', tone: 'danger' },
};

export function QualityBadge({ rating }) {
  const q = QUALITY[String(rating ?? '').toUpperCase()];
  return <Badge tone={q?.tone ?? 'neutral'} label={q?.label ?? 'Not rated yet'} />;
}

export function NumberCard({ number, onMenu }) {
  const { colors, spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="subheading" selectable>{number.display_phone_number || displayPhone(number.phone_number_id)}</Text>
          {number.verified_name ? <Text variant="small" muted>{number.verified_name}</Text> : null}
          {number.waba?.name ? <Text variant="caption" muted>{number.waba.name}</Text> : null}
        </View>
        {onMenu ? (
          <Pressable onPress={() => onMenu(number)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Number actions">
            <Ionicons name="ellipsis-vertical" size={22} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <QualityBadge rating={number.quality_rating} />
        <Badge tone={String(number.status).toLowerCase() === 'connected' ? 'success' : 'neutral'} label={String(number.status ?? 'unknown')} />
        {number.is_default ? <Badge tone="accent" label="Default" /> : null}
        {!number.is_registered ? <Badge tone="danger" label="Not registered" /> : null}
      </View>
    </Card>
  );
}
