import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

// A grey block that gently pulses while real content is loading.
export function Skeleton({ width = '100%', height = 14, radius = 6, style }) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.border, opacity }, style]} />;
}

// variant 'row': avatar + two lines (inbox, contacts, team...). 'card': title, a line and a bar (campaigns, templates...).
export function ListSkeleton({ rows = 7, variant = 'row' }) {
  const { colors, spacing } = useTheme();
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {variant === 'row' ? <Skeleton width={46} height={46} radius={23} /> : null}
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width={`${55 + ((i * 13) % 30)}%`} height={14} />
            <Skeleton width={`${35 + ((i * 17) % 40)}%`} height={11} />
            {variant === 'card' ? <Skeleton height={6} radius={3} /> : null}
          </View>
        </View>
      ))}
    </View>
  );
}
