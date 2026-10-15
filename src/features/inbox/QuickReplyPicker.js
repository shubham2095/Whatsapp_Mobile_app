import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Sheet, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

// Saved replies to drop into the message box. `onPick(reply)` receives { id, title, text }.
export function QuickReplyPicker({ visible, replies, loaded, onPick, onClose }) {
  const { colors, spacing } = useTheme();
  return (
    <Sheet visible={visible} title="Quick replies" onClose={onClose}>
      {loaded && replies.length === 0 ? (
        <Text muted style={{ textAlign: 'center', marginVertical: spacing.lg }}>No saved replies yet. Add your most common answers once and reuse them in every chat.</Text>
      ) : null}
      {replies.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => {
            onPick(r);
            onClose();
          }}
          accessibilityRole="button"
          style={({ pressed }) => ({ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ fontWeight: '700' }}>{r.title}</Text>
          <Text variant="small" muted numberOfLines={2}>{r.text}</Text>
        </Pressable>
      ))}
      <View style={{ height: spacing.md }} />
      <Button
        title="Manage quick replies"
        variant="outline"
        onPress={() => {
          onClose();
          router.push('/quick-replies');
        }}
      />
    </Sheet>
  );
}
