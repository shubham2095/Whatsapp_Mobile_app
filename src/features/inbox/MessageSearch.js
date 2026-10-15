import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { formatDayLabel, formatTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

const MAX_MESSAGES = 1000;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Bold-and-tint the part of `body` that matched the search.
function Highlighted({ body, term, color }) {
  const parts = body.split(new RegExp(`(${escapeRegExp(term)})`, 'i'));
  return (
    <Text numberOfLines={3}>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <Text key={i} style={{ fontWeight: '800', color, backgroundColor: color + '22' }}>{part}</Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

// Search the messages of one chat. The backend has no search endpoint, so this walks back through the
// loaded history (loading older pages while you type) and matches message text on the phone.
export function MessageSearch({ messages, hasNextPage, isFetchingNextPage, fetchNextPage, onPick, onClose }) {
  const { colors, spacing } = useTheme();
  const [term, setTerm] = useState('');
  const query = term.trim();
  const reachedCap = messages.length >= MAX_MESSAGES && hasNextPage;

  useEffect(() => {
    if (query.length < 2 || !hasNextPage || isFetchingNextPage || messages.length >= MAX_MESSAGES) return;
    fetchNextPage();
  }, [query, hasNextPage, isFetchingNextPage, fetchNextPage, messages.length]);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const needle = query.toLowerCase();
    return messages.filter((m) => m.body && m.body.toLowerCase().includes(needle));
  }, [messages, query]);

  const searching = query.length >= 2 && hasNextPage && !reachedCap;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close search">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <TextInput
          autoFocus
          value={term}
          onChangeText={setTerm}
          placeholder="Search in this chat"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={{ flex: 1, color: colors.text, fontSize: 16, paddingVertical: spacing.xs }}
        />
        {term ? (
          <Pressable onPress={() => setTerm('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        ListHeaderComponent={
          query.length >= 2 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md }}>
              {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              <Text variant="caption" muted>
                {results.length} {results.length === 1 ? 'message' : 'messages'} found{searching ? ', looking through older messages...' : ''}
                {reachedCap ? ', only recent history searched' : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
            <Text muted style={{ textAlign: 'center' }}>
              {query.length < 2 ? 'Type at least 2 letters to find a message.' : searching ? '' : 'No messages match.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item)}
            accessibilityRole="button"
            style={({ pressed }) => ({ padding: spacing.md, gap: 2, backgroundColor: pressed ? colors.chipBg : colors.card, borderBottomWidth: 1, borderBottomColor: colors.border })}
          >
            <Text variant="caption" muted>
              {item.direction === 'inbound' ? 'Customer' : 'You'} - {formatDayLabel(item.created_at)}, {formatTime(item.created_at)}
            </Text>
            <Highlighted body={item.body} term={query} color={colors.primary} />
          </Pressable>
        )}
      />
    </View>
  );
}
