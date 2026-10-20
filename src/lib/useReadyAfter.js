import { useEffect, useState } from 'react';

// false for the first `ms` milliseconds after the screen appears, then true. Used to let the important requests of a
// screen go out first and start the nice-to-have ones a moment later.
export function useReadyAfter(ms = 1200) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return ready;
}
