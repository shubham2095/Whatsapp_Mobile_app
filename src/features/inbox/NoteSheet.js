import { useState } from 'react';
import { Button, Input, Sheet, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useAddNote } from './hooks';

// Write an internal note for the team. It is saved on the server and shown in the chat, not sent to WhatsApp.
export function NoteSheet({ visible, conversationId, onClose, onSaved }) {
  const { spacing } = useTheme();
  const add = useAddNote(conversationId);
  const [body, setBody] = useState('');

  function close() {
    setBody('');
    add.reset();
    onClose();
  }

  function save() {
    add.mutate(body.trim(), {
      onSuccess: () => {
        setBody('');
        onSaved?.();
        onClose();
      },
    });
  }

  return (
    <Sheet visible={visible} title="Internal note" onClose={close}>
      <Text variant="small" muted style={{ marginBottom: spacing.sm }}>
        Only your team sees this. It is not sent to the customer.
      </Text>
      <Input
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={2000}
        autoFocus
        placeholder="For example: asked for a discount, call back tomorrow"
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        error={add.isError ? add.error.message : undefined}
      />
      <Button title="Save note" onPress={save} loading={add.isPending} disabled={body.trim().length === 0} />
    </Sheet>
  );
}
