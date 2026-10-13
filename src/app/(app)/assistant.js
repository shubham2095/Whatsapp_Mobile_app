import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ask } from '@/api/assistant';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const SUGGESTIONS = [
  'Aaj kitne messages aaye?',
  'How many open conversations do I have?',
  'Kitne hot leads hain?',
  'Give me a summary of my dashboard',
];

const GREETING = {
  id: 'hello',
  role: 'assistant',
  text: 'Hi! Apne data ke baare mein kuch bhi poochho: aaj ke messages, open chats, hot leads ya overall summary. Main sirf aapka hi data dekhta hoon.',
};

// Answers questions about the user's own workspace data (server limit: 20 questions a minute).
export default function Assistant() {
  const { colors, radius, spacing, fontSize } = useTheme();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const counter = useRef(0);
  const listRef = useRef(null);

  const nextId = () => {
    counter.current += 1;
    return `m${counter.current}`;
  };
  const scrollDown = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

  async function send(question) {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setMessages((m) => [...m, { id: nextId(), role: 'user', text: q }]);
    setBusy(true);
    scrollDown();
    try {
      const res = await ask(q);
      setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: res.answer }]);
    } catch (e) {
      const text = e.status === 429 ? 'Thoda ruko, bahut zyada sawaal ho gaye. Ek minute baad dobara try karo.' : e.message;
      setMessages((m) => [...m, { id: nextId(), role: 'assistant', text, failed: true }]);
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding">
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollDown}
        renderItem={({ item }) => {
          const mine = item.role === 'user';
          return (
            <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <View style={{ maxWidth: '85%', backgroundColor: mine ? colors.bubbleOut : item.failed ? colors.danger + '1a' : colors.card, borderRadius: radius.md, borderWidth: mine ? 0 : 1, borderColor: colors.border, padding: spacing.md }}>
                <Text selectable color={item.failed ? colors.danger : undefined}>{item.text}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ gap: spacing.sm }}>
            {busy ? <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', margin: spacing.sm }} /> : null}
            {messages.length === 1 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} onPress={() => send(s)} accessibilityRole="button" style={{ backgroundColor: colors.chipBg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8 }}>
                    <Text variant="small" color={colors.primary} style={{ fontWeight: '600' }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        }
      />

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your data"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1000}
          style={{ flex: 1, maxHeight: 110, minHeight: 44, backgroundColor: colors.bg, color: colors.text, borderRadius: 22, paddingHorizontal: spacing.md, paddingVertical: 11, fontSize: fontSize.md }}
        />
        <Pressable
          onPress={() => send(input)}
          disabled={busy || !input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send question"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.5 : 1 }}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
