import { useCallback, useRef, useState } from 'react';
import { useSendText } from './hooks';

// Text messages that are on their way. They show in the chat at once as "sending", turn into the real
// message when the server confirms, or stay as "failed" with a way to send again. Without internet the
// send simply waits (React Query pauses it) and goes out by itself when the connection is back.
export function useOutbox(conversationId) {
  const { mutateAsync } = useSendText(conversationId);
  const [items, setItems] = useState([]); // newest first, same order as the chat list
  const counter = useRef(0);

  const patch = useCallback((id, changes) => setItems((all) => all.map((m) => (m.id === id ? { ...m, ...changes } : m))), []);

  const run = useCallback(
    async (id, body) => {
      patch(id, { status: 'sending', error_message: null });
      try {
        await mutateAsync(body);
        // The real message is already in the chat cache by now; drop the placeholder.
        setItems((all) => all.filter((m) => m.id !== id));
      } catch (e) {
        patch(id, { status: 'failed', error_message: e?.message || 'Could not send. Tap to try again.' });
      }
    },
    [mutateAsync, patch],
  );

  const send = useCallback(
    (body) => {
      counter.current += 1;
      const id = `local-${counter.current}`;
      const placeholder = {
        id,
        _local: true,
        direction: 'outbound',
        type: 'text',
        body,
        status: 'sending',
        created_at: new Date().toISOString(),
        attachments: [],
        error_message: null,
      };
      setItems((all) => [placeholder, ...all]);
      run(id, body);
    },
    [run],
  );

  const retry = useCallback(
    (id) => {
      const item = items.find((m) => m.id === id);
      if (item) run(id, item.body);
    },
    [items, run],
  );

  const discard = useCallback((id) => setItems((all) => all.filter((m) => m.id !== id)), []);

  return { items, send, retry, discard };
}
