import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { FEATURE_LABELS, LIMIT_LABELS, enabledFeatures, periodLabel, showLimit } from './planMeta';

export function PlanCard({ plan, current, canBuy, onChoose }) {
  const { colors, spacing } = useTheme();
  const features = enabledFeatures(plan);
  const free = plan.price <= 0;

  return (
    <Card style={{ gap: spacing.sm, borderColor: current ? colors.primary : colors.border, borderWidth: current ? 2 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="subheading" style={{ flex: 1 }}>{plan.name}</Text>
        {current ? <Badge tone="success" label="Current plan" /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        <Text variant="title">{free ? 'Free' : plan.price_display}</Text>
        {free ? null : <Text muted style={{ marginBottom: 4 }}>/ {periodLabel(plan)} + GST</Text>}
      </View>
      {plan.description ? <Text variant="small" muted>{plan.description}</Text> : null}
      {plan.trial_days > 0 ? <Badge tone="accent" label={`${plan.trial_days}-day trial`} /> : null}

      <View style={{ gap: 4, marginTop: spacing.xs }}>
        {Object.keys(LIMIT_LABELS).map((k) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="small" muted>{LIMIT_LABELS[k]}</Text>
            <Text variant="small" style={{ fontWeight: '700' }}>{showLimit(plan.limits?.[k])}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 4 }}>
        {features.length === 0 ? <Text variant="caption" muted>Core features included</Text> : null}
        {features.map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text variant="small">{FEATURE_LABELS[k]}</Text>
          </View>
        ))}
      </View>

      <Button
        title={current ? 'Renew this plan' : free ? 'Choose free plan' : 'Choose plan'}
        variant={current ? 'outline' : 'primary'}
        disabled={!canBuy}
        onPress={() => onChoose(plan)}
      />
    </Card>
  );
}
