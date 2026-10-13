import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionSheet, Avatar, Badge, Banner, EmptyState, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useRemoveMember, useTeam, useToggleMember } from '@/features/team/hooks';
import { formatListTime } from '@/lib/format';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

export default function Team() {
  const me = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useTeam();
  const toggle = useToggleMember();
  const remove = useRemoveMember();
  const [menuFor, setMenuFor] = useState(null);
  const [notice, setNotice] = useState(null);

  const canInvite = can(me, 'team.invite');
  const canUpdate = can(me, 'team.update');
  const canRemove = can(me, 'team.remove');
  const fail = (title) => (e) => Alert.alert(title, e.message);

  function confirmRemove(m) {
    Alert.alert('Remove team member', `${m.name} will lose access to this workspace.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(m.id, { onSuccess: () => setNotice('Team member removed.'), onError: fail('Could not remove') }) },
    ]);
  }

  const isMe = (m) => m.email === me.email;
  const menu = menuFor
    ? [
        ...(canUpdate ? [{ label: 'Edit', icon: 'create-outline', onPress: () => router.push({ pathname: '/team-form', params: { id: menuFor.id } }) }] : []),
        ...(canUpdate && !isMe(menuFor)
          ? [{
              label: menuFor.status === 'active' ? 'Deactivate' : 'Activate',
              icon: menuFor.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline',
              onPress: () => toggle.mutate(menuFor.id, { onError: fail('Could not update') }),
            }]
          : []),
        ...(canRemove && !isMe(menuFor) ? [{ label: 'Remove', icon: 'trash-outline', danger: true, onPress: () => confirmRemove(menuFor) }] : []),
      ]
    : [];

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <View style={{ padding: spacing.lg }}>
        <Banner message={error.message} />
        <Pressable onPress={() => refetch()} accessibilityRole="button">
          <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const featureLabel = Object.fromEntries((data.features ?? []).map((f) => [f.key, f.label]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {notice ? <View style={{ padding: spacing.md, paddingBottom: 0 }}><Banner tone="success" message={notice} /></View> : null}
      <FlatList
        data={data.members}
        keyExtractor={(m) => m.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No team members yet" message={canInvite ? 'Tap + to add an agent.' : undefined} />}
        contentContainerStyle={data.members.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Avatar name={item.name} size={46} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>{item.name}{isMe(item) ? ' (you)' : ''}</Text>
                <Badge tone={item.role === 'admin' ? 'accent' : 'neutral'} label={item.role_label} />
              </View>
              <Text variant="small" muted numberOfLines={1}>{item.email}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: 2 }}>
                <Badge tone={item.status === 'active' ? 'success' : 'warning'} label={item.status} />
                {item.role === 'agent' && item.features.length > 0 ? (
                  <Text variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>{item.features.map((k) => featureLabel[k] ?? k).join(', ')}</Text>
                ) : null}
              </View>
              {item.last_login_at ? <Text variant="caption" muted>Last login {formatListTime(item.last_login_at)}</Text> : null}
            </View>
            {menu.length > 0 || canUpdate || canRemove ? (
              <Pressable onPress={() => setMenuFor(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Actions for ${item.name}`}>
                <Ionicons name="ellipsis-vertical" size={22} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        )}
      />

      <ActionSheet visible={!!menuFor && menu.length > 0} title={menuFor?.name} actions={menu} onClose={() => setMenuFor(null)} />

      {canInvite ? (
        <Pressable
          onPress={() => router.push('/team-form')}
          accessibilityRole="button"
          accessibilityLabel="Add team member"
          style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        >
          <Ionicons name="person-add" size={26} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}
