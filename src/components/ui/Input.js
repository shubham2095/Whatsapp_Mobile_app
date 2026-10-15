import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontRegular } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// `password` adds a show/hide toggle and hides the text by default. The border turns teal while typing.
export const Input = forwardRef(function Input({ label, error, password = false, style, onFocus, onBlur, ...rest }, ref) {
  const { colors, radius, spacing, fontSize } = useTheme();
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>{label}</Text> : null}
      <View>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          secureTextEntry={password && hidden}
          autoCapitalize={password ? 'none' : rest.autoCapitalize}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderWidth: focused || error ? 1.5 : 1,
              borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
              borderRadius: radius.md,
              paddingHorizontal: spacing.lg,
              paddingRight: password ? 48 : spacing.lg,
              paddingVertical: spacing.md,
              fontSize: fontSize.md,
              fontFamily: fontRegular,
              minHeight: 50,
            },
            style,
          ]}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
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
