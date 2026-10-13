import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

// value / total as a thin bar. `tone` picks the fill colour.
export function ProgressBar({ value, total, tone = 'primary' }) {
  const { colors } = useTheme();
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: value }} style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: colors[tone] ?? colors.primary }} />
    </View>
  );
}
