import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { CountUp } from './CountUp';
import { Text } from './Text';

// Small KPI tile: icon, big number, label. Sits two per row (flexBasis 47%).
export function StatCard({ icon, label, value, tone = 'primary' }) {
  const { colors, radius, spacing, shadows } = useTheme();
  const tint = colors[tone] ?? colors.primary;
  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      style={{ flexGrow: 1, flexBasis: '47%', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 4, ...shadows.card }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: tint + '1f', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <CountUp value={value} variant="heading" style={{ fontVariant: ['tabular-nums'] }} />
      <Text variant="small" muted>{label}</Text>
    </View>
  );
}
