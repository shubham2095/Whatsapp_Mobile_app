import { forwardRef } from 'react';
import { TextInput, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export const Input = forwardRef(function Input({ label, error, style, ...rest }, ref) {
  const { colors, radius, spacing, fontSize } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        {...rest}
        style={[
          {
            backgroundColor: colors.inputBg,
            color: colors.text,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            fontSize: fontSize.md,
            minHeight: 48,
          },
          style,
        ]}
      />
      {error ? <Text variant="caption" color={colors.danger} style={{ marginTop: spacing.xs }}>{error}</Text> : null}
    </View>
  );
});
