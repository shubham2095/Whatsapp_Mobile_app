import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// Multi-select list with checkboxes. items: [{ key, label }]; value: array of selected keys.
export function CheckList({ label, items, value, onChange }) {
  const { colors, spacing } = useTheme();
  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>{label}</Text> : null}
      {items.map((item) => {
        const on = value.includes(item.key);
        return (
          <Pressable
            key={item.key}
            onPress={() => toggle(item.key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={colors.primary} />
            <Text>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
