import { useEffect, useRef, useState } from 'react';
import { Text } from './Text';

// Shows a whole number that counts up to its value (used on dashboard tiles). Anything that is not a plain number is
// shown as it is, so "-" or "12 / 50" are left alone.
export function CountUp({ value, duration = 650, ...textProps }) {
  const raw = String(value ?? '').replace(/,/g, '');
  const target = /^\d+$/.test(raw) ? Number(raw) : null;
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (target === null) return undefined;
    const start = from.current;
    const t0 = Date.now();
    let frame;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - (1 - p) ** 3; // fast at first, settles gently
      const current = Math.round(start + (target - start) * eased);
      from.current = current;
      setShown(current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return <Text {...textProps}>{target === null ? String(value) : shown.toLocaleString()}</Text>;
}
