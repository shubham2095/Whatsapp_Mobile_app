import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Banner, Button, EmptyState, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useAgent, useUnassignConversation } from '@/features/team/hooks';
import { formatListTime } from '@/lib/format';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

const STATUS_TONE = { open: 'success', pending: 'warning', resolved: 'neutral', closed: 'muted' };

export default function AgentDetail() {
  const { id } = useLocalSearchParams();
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch } = useAgent(id);
  const unassign = useUnassignConversation();

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </View>
    );
  }

  const agent = data.agent;
  const canChat = can(user, 'conversations.view');

  function confirmUnassign(c) {
    Alert.alert('Unassign chat', `${c.contact_name || c.contact_phone || 'This chat'} will no longer be assigned to ${agent.name}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unassign', style: 'destructive', onPress: () => unassign.mutate(c.id, { onError: (e) => Alert.alert('Could not unassign', e.message) }) },
    ]);
  }

  const header = (
    <View style={{ alignItems: 'center', gap: spacing.xs, padding: spacing.lg }}>
      <Avatar name={agent.name} size={64} />
      <Text variant="heading">{agent.name}</Text>
      <Text muted>{agent.email}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Badge label={`${agent.active_conversations_count} active`} tone="success" />
        <Badge label={`${agent.total_handled} handled`} />
      </View>
      <Text variant="subheading" style={{ alignSelf: 'flex-start', marginTop: spacing.md }}>Assigned chats</Text>
    </View>
  );

  return (
    <FlatList
      data={agent.conversations}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No assigned chats" />}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable
            disabled={!canChat}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: { id: item.id, name: item.contact_name || item.contact_phone || 'Chat', phone: item.contact_phone ?? '', windowOpen: 'false' },
              })
            }
            accessibilityRole="button"
            style={{ flex: 1, gap: 2 }}
          >
            <Text style={{ fontWeight: '600' }} numberOfLines={1}>{item.contact_name || item.contact_phone || 'Unknown'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Badge tone={STATUS_TONE[item.status] ?? 'muted'} label={item.status} />
              <Text variant="caption" muted>{formatListTime(item.last_message_at)}</Text>
            </View>
          </Pressable>
          {canChat ? (
            <Pressable onPress={() => confirmUnassign(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Unassign chat">
              <Ionicons name="person-remove-outline" size={22} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      )}
    />
  );
}
