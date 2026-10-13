import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// Single-choice chips that wrap onto several lines. options: [{ value, label }]
export function ChipSelect({ label, options, value, onChange }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{ paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: active ? colors.primary : colors.chipBg }}
            >
              <Text variant="small" style={{ color: active ? '#fff' : colors.primary, fontWeight: '600' }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
