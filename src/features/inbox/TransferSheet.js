import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Banner, Sheet, Text } from '@/components/ui';
import { useAssignConversation, useAssignableAgents, useUnassignConversation } from '@/features/team/hooks';
import { useTheme } from '@/theme/ThemeProvider';

// Hand a chat to a teammate, or take it off everyone (unassign).
export function TransferSheet({ visible, conversationId, onClose }) {
  const { colors, spacing } = useTheme();
  const agents = useAssignableAgents(visible);
  const assign = useAssignConversation();
  const unassign = useUnassignConversation();
  const [error, setError] = useState(null);
  const busy = assign.isPending || unassign.isPending;

  function run(mutation, vars) {
    setError(null);
    mutation.mutate(vars, { onSuccess: onClose, onError: (e) => setError(e.message) });
  }

  return (
    <Sheet visible={visible} title="Transfer chat" onClose={onClose}>
      <Banner message={error ?? (agents.isError ? agents.error.message : null)} />
      {agents.isLoading ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} /> : null}
      {agents.data?.agents.length === 0 ? <Text muted style={{ textAlign: 'center', margin: spacing.lg }}>No active teammates to transfer to.</Text> : null}
      {agents.data?.agents.map((a) => (
        <Pressable
          key={a.id}
          disabled={busy}
          onPress={() => run(assign, { conversationId, agentId: a.id })}
          accessibilityRole="button"
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: pressed || busy ? 0.6 : 1 })}
        >
          <Avatar name={a.name} size={38} />
          <Text style={{ flex: 1 }}>{a.name}{a.is_me ? ' (you)' : ''}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ))}
      <View style={{ height: spacing.sm }} />
      <Pressable
        disabled={busy}
        onPress={() => run(unassign, conversationId)}
        accessibilityRole="button"
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, opacity: pressed || busy ? 0.6 : 1 })}
      >
        <Ionicons name="person-remove-outline" size={22} color={colors.danger} />
        <Text color={colors.danger}>Unassign chat</Text>
      </Pressable>
    </Sheet>
  );
}
