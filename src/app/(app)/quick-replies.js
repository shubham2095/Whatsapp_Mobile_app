import { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, EmptyState, Input, Sheet, Text } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useUser } from '@/features/auth/AuthProvider';
import { useQuickReplies } from '@/features/inbox/quickReplies';
import { useTheme } from '@/theme/ThemeProvider';

// Saved replies are kept on this phone for your login. {name} becomes the customer's first name, {agent} your name.
export default function QuickReplies() {
  const user = useUser();
  const toast = useToast();
  const { colors, spacing } = useTheme();
  const { replies, save, remove } = useQuickReplies(user.id);
  const [editing, setEditing] = useState(null); // { id?, title, text }
  const [error, setError] = useState(null);

  function open(reply) {
    setError(null);
    setEditing(reply ? { id: reply.id, title: reply.title, text: reply.text } : { title: '', text: '' });
  }

  function submit() {
    if (!editing.title.trim()) return setError('Give it a short name, like "Greeting".');
    if (!editing.text.trim()) return setError('Write the message to send.');
    save(editing);
    setEditing(null);
    toast.show(editing.id ? 'Quick reply updated' : 'Quick reply added');
    return undefined;
  }

  function confirmDelete() {
    Alert.alert('Delete quick reply', `Remove "${editing.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(editing.id);
          setEditing(null);
          toast.show('Quick reply deleted');
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={replies}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={
          <Text variant="small" muted style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
            In a chat, tap the bolt button, or type / and a few letters. Use {'{name}'} for the first name of the customer and {'{agent}'} for your name. These are saved on this phone.
          </Text>
        }
        ListEmptyComponent={<EmptyState icon="flash-outline" title="No quick replies yet" message="Tap + to save your first one." />}
        contentContainerStyle={replies.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            accessibilityRole="button"
            style={({ pressed }) => ({ padding: spacing.lg, gap: 2, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
          >
            <Text style={{ fontWeight: '700' }}>{item.title}</Text>
            <Text variant="small" muted numberOfLines={3}>{item.text}</Text>
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => open(null)}
        accessibilityRole="button"
        accessibilityLabel="Add quick reply"
        style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <Sheet visible={!!editing} title={editing?.id ? 'Edit quick reply' : 'New quick reply'} onClose={() => setEditing(null)}>
        {editing ? (
          <>
            <Input label="Name" value={editing.title} onChangeText={(v) => setEditing((e) => ({ ...e, title: v }))} maxLength={40} placeholder="Greeting" error={error && !editing.title.trim() ? error : undefined} />
            <Input
              label="Message"
              value={editing.text}
              onChangeText={(v) => setEditing((e) => ({ ...e, text: v }))}
              multiline
              maxLength={1000}
              placeholder="Hi {name}, thanks for contacting us!"
              style={{ minHeight: 110, textAlignVertical: 'top' }}
              error={error && editing.title.trim() ? error : undefined}
            />
            <Button title="Save" onPress={submit} />
            {editing.id ? <Button title="Delete" variant="ghost" onPress={confirmDelete} style={{ marginTop: spacing.sm }} /> : null}
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
