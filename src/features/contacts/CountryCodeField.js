import { View } from 'react-native';
import { Input, Text } from '@/components/ui';

// Prefix for numbers that have no country code (e.g. a phone book that stores "98765 43210").
export function CountryCodeField({ value, onChange }) {
  return (
    <View>
      <Input
        label="Country code for numbers without one"
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        placeholder="91"
      />
      <Text variant="caption" muted style={{ marginTop: -8, marginBottom: 12 }}>
        Numbers that already start with + or a country code are left as they are.
      </Text>
    </View>
  );
}
