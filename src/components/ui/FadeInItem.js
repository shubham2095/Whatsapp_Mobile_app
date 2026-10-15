import Animated, { FadeInDown } from 'react-native-reanimated';

const MAX_ANIMATED = 10;

// Wrap a list row so the first screenful slides up and fades in one after another. Rows further down (and rows that
// scroll back into view later) are drawn plainly, so long lists stay smooth.
export function FadeInItem({ index = 0, children }) {
  if (index >= MAX_ANIMATED) return children;
  return <Animated.View entering={FadeInDown.delay(index * 35).duration(260)}>{children}</Animated.View>;
}
