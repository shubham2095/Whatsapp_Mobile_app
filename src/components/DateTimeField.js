import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';

// Date + time picker. Android opens the system date dialog, then the time dialog.
// `value` is a Date or null; `onChange(date | null)`.
export function DateTimeField({ label, value, onChange, minimumDate }) {
  const { colors, radius, spacing } = useTheme();
  const now = useNow();
  const earliest = minimumDate ?? new Date(now);
  const suggested = value ?? new Date(now + 60 * 60 * 1000);

  function openAndroid() {
    DateTimePickerAndroid.open({
      value: suggested,
      mode: 'date',
      minimumDate: earliest,
      onChange: (event, day) => {
        if (event.type !== 'set' || !day) return;
        DateTimePickerAndroid.open({
          value: day,
          mode: 'time',
          is24Hour: false,
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== 'set' || !time) return;
            const picked = new Date(day);
            picked.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(picked);
          },
        });
      },
    });
  }

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>{label}</Text> : null}
      {Platform.OS === 'android' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Pressable
            onPress={openAndroid}
            accessibilityRole="button"
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.inputBg }}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
            <Text style={{ flex: 1 }} muted={!value}>{value ? value.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Pick date and time'}</Text>
          </Pressable>
          {value ? (
            <Pressable onPress={() => onChange(null)} hitSlop={10} accessibilityLabel="Clear date">
              <Ionicons name="close-circle" size={24} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <DateTimePicker value={suggested} mode="datetime" minimumDate={earliest} onChange={(_e, d) => d && onChange(d)} />
      )}
    </View>
  );
}
