import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontRegular } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// `password` adds a show/hide toggle and hides the text by default.
export const Input = forwardRef(function Input({ label, error, password = false, style, ...rest }, ref) {
  const { colors, radius, spacing, fontSize } = useTheme();
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>{label}</Text> : null}
      <View>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          secureTextEntry={password && hidden}
          autoCapitalize={password ? 'none' : rest.autoCapitalize}
          {...rest}
          style={[
            {
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderWidth: 1,
              borderColor: error ? colors.danger : colors.border,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingRight: password ? 48 : spacing.md,
              paddingVertical: spacing.md,
              fontSize: fontSize.md,
              fontFamily: fontRegular,
              minHeight: 48,
            },
            style,
          ]}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text variant="caption" color={colors.danger} style={{ marginTop: spacing.xs }}>{error}</Text> : null}
    </View>
  );
});
