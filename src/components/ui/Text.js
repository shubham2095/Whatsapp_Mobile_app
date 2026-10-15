import { StyleSheet, Text as RNText } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { familyFor } from '@/theme/fonts';

// Line heights give text room to breathe (about 1.4x for body copy); headings sit a little tighter.
const VARIANTS = {
  title: { size: 'xxl', weight: '700', lineHeight: 36, letterSpacing: -0.4 },
  heading: { size: 'xl', weight: '700', lineHeight: 29, letterSpacing: -0.3 },
  subheading: { size: 'lg', weight: '600', lineHeight: 24, letterSpacing: -0.1 },
  body: { size: 'md', weight: '400', lineHeight: 22 },
  small: { size: 'sm', weight: '400', lineHeight: 19 },
  caption: { size: 'xs', weight: '400', lineHeight: 16, letterSpacing: 0.1 },
};

export function Text({ variant = 'body', muted = false, color, style, ...rest }) {
  const { colors, fontSize } = useTheme();
  const v = VARIANTS[variant];
  // A caller's fontWeight picks the Inter file; the variant's weight is the default.
  const { fontWeight, ...custom } = StyleSheet.flatten(style) ?? {};
  // A caller that picks its own size gets a matching line height, or the fixed one would clip big text.
  if (custom.fontSize && custom.lineHeight === undefined) custom.lineHeight = Math.round(custom.fontSize * 1.35);
  return (
    <RNText
      {...rest}
      style={[
        {
          fontSize: fontSize[v.size],
          lineHeight: v.lineHeight,
          letterSpacing: v.letterSpacing,
          color: color ?? (muted ? colors.muted : colors.text),
          fontFamily: familyFor(fontWeight ?? v.weight),
          fontWeight: 'normal',
        },
        custom,
      ]}
    />
  );
}
