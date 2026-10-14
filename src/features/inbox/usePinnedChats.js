import { useCallback, useEffect, useState } from 'react';
import { getPinnedChats, savePinnedChats } from '@/lib/storage';

// Pinned chat ids for this user. pinned is a Set, toggle(id) flips one and saves.
export function usePinnedChats(userId) {
  const [pinned, setPinned] = useState(() => new Set());

  useEffect(() => {
    let alive = true;
    getPinnedChats(userId).then((ids) => alive && setPinned(new Set(ids)));
    return () => {
      alive = false;
    };
  }, [userId]);

  const toggle = useCallback(
    (id) => {
      setPinned((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        savePinnedChats(userId, [...next]);
        return next;
      });
    },
    [userId],
  );

  return { pinned, toggle };
}
