import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

// false for the first `ms` milliseconds after the screen appears (and until its animations have finished), then true.
// Used to let the important requests of a screen go out first and start the nice-to-have ones a moment later.
export function useReadyAfter(ms = 1200) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let timer;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => setReady(true), ms);
    });
    return () => {
      task.cancel();
      clearTimeout(timer);
    };
  }, [ms]);
  return ready;
}
