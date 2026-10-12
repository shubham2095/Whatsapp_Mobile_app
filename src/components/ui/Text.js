import { Text as RNText } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

const VARIANTS = {
  title: { size: 'xxl', weight: '700' },
  heading: { size: 'xl', weight: '700' },
  subheading: { size: 'lg', weight: '600' },
  body: { size: 'md', weight: '400' },
  small: { size: 'sm', weight: '400' },
  caption: { size: 'xs', weight: '400' },
};

export function Text({ variant = 'body', muted = false, color, style, ...rest }) {
  const { colors, fontSize } = useTheme();
  const v = VARIANTS[variant];
  return (
    <RNText
      {...rest}
      style={[{ fontSize: fontSize[v.size], fontWeight: v.weight, color: color ?? (muted ? colors.muted : colors.text) }, style]}
    />
  );
}
