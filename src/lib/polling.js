import { useSyncExternalStore } from 'react';

// How the app keeps lists fresh without hammering the server. Many phones polling every few seconds adds up fast, so:
//  - a list that has stopped changing is asked for less and less often, and goes back to fast the moment it changes;
//  - with push notifications working, a new message already refreshes the lists, so polling is only a slow safety net;
//  - when the server is struggling (errors, timeouts, "too many requests") every list slows down further, and a small
//    "server is busy" note shows, so the app helps the server recover instead of making it worse;
//  - every wait gets a small random spread, so thousands of phones do not all ask in the same second.

let pushActive = false;
export const setPushActive = (active) => {
  pushActive = active;
};

// ---- server health --------------------------------------------------------------------------------------------
let failures = 0;
let snapshot = { busy: false };
const listeners = new Set();
const publish = (busy) => {
  if (snapshot.busy === busy) return;
  snapshot = { busy };
  listeners.forEach((l) => l());
};

export function reportServerOk() {
  if (failures > 0) {
    failures = 0;
    publish(false);
  }
}

// Call for 5xx answers, timeouts and "too many requests" (429, which counts double: the server asked us to slow down).
export function reportServerFailure({ tooMany = false } = {}) {
  failures += tooMany ? 2 : 1;
  if (failures >= 2) publish(true);
}

const busyFactor = () => (failures >= 6 ? 8 : failures >= 4 ? 4 : failures >= 2 ? 2 : 1);

export const useServerBusy = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot.busy,
  );

// ---- polling delay --------------------------------------------------------------------------------------------
const streaks = new Map(); // queryHash -> { updatedAt, data, streak }

/**
 * For `refetchInterval: (query) => nextPollDelay(query, {...})`.
 * base: wait when things are changing. cap: the longest wait for a quiet list. capWithPush: the same, when push works.
 * The wait doubles after every two answers that brought nothing new.
 */
export function nextPollDelay(query, { base, cap, capWithPush = cap }) {
  const hash = query.queryHash;
  const { dataUpdatedAt, data } = query.state;
  const prev = streaks.get(hash);
  let streak = prev?.streak ?? 0;
  if (prev && prev.updatedAt !== dataUpdatedAt) streak = prev.data === data ? prev.streak + 1 : 0;
  streaks.set(hash, { updatedAt: dataUpdatedAt, data, streak });

  const longest = pushActive ? capWithPush : cap;
  const wait = Math.min(longest, base * 2 ** Math.floor(streak / 2)) * busyFactor();
  return Math.round(wait * (0.85 + Math.random() * 0.3));
}
