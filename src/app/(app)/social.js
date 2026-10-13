import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ActionSheet, Badge, Banner, Button, Card, EmptyState, Input, Sheet, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import {
  useConnectPage,
  useDeletePost,
  useDisconnectSocial,
  usePublishPost,
  useRecheckInstagram,
  useSocialConnection,
  useSocialPosts,
  useUpdatePost,
} from '@/features/automation/hooks';
import { fieldError } from '@/lib/errors';
import { formatListTime } from '@/lib/format';
import { can, hasFeature } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

const STATUS_TONE = { draft: 'muted', scheduled: 'warning', published: 'success', partial: 'warning', failed: 'danger' };
const PLATFORM = { facebook: 'Facebook', instagram: 'Instagram' };

export default function Social() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const connection = useSocialConnection();
  const posts = useSocialPosts();
  const connect = useConnectPage();
  const recheck = useRecheckInstagram();
  const disconnect = useDisconnectSocial();
  const publish = usePublishPost();
  const update = useUpdatePost();
  const remove = useDeletePost();

  const canManage = can(user, 'whatsapp.manage'); // connecting a Page is admin-only
  const canPost = can(user, 'campaigns.create');
  const [menuFor, setMenuFor] = useState(null);
  const [sheet, setSheet] = useState(null); // 'connect' | { edit: post }
  const [form, setForm] = useState({ page_id: '', token: '', caption: '' });
  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);

  if (!hasFeature(user, 'social')) {
    return <EmptyState icon="lock-closed-outline" title="Social publishing is not in your plan" message="Upgrade your plan on the Heltog web app to post to Facebook and Instagram." />;
  }
  if (connection.isLoading || posts.isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;

  const conn = connection.data?.connection;
  const list = posts.data?.posts ?? [];
  const note = (res, fallback) => setNotice({ tone: 'success', text: res?.note || res?.message || fallback });
  const fail = (title) => (e) => Alert.alert(title, e.message);

  function submitSheet() {
    setFormError(null);
    if (sheet === 'connect') {
      if (!form.page_id.trim() || !form.token.trim()) return setFormError({ message: 'Enter the Page ID and the Page access token.' });
      connect.mutate(
        { page_id: form.page_id.trim(), page_access_token: form.token.trim() },
        { onSuccess: () => { setSheet(null); setNotice({ tone: 'success', text: 'Facebook Page connected.' }); }, onError: setFormError },
      );
    } else {
      update.mutate(
        { id: sheet.edit.id, caption: form.caption.trim() },
        { onSuccess: (res) => { setSheet(null); note(res, 'Caption updated.'); }, onError: setFormError },
      );
    }
    return undefined;
  }

  function confirmDisconnect() {
    Alert.alert('Disconnect Page', 'Scheduled posts will no longer publish.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => disconnect.mutate(undefined, { onError: fail('Could not disconnect') }) },
    ]);
  }

  function confirmDelete(p) {
    Alert.alert('Delete post', 'It is removed here and from Facebook. Instagram posts must be removed in the Instagram app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(p.id, { onSuccess: (res) => note(res, 'Post deleted.'), onError: fail('Could not delete') }) },
    ]);
  }

  const canPublish = (p) => ['draft', 'scheduled', 'failed', 'partial'].includes(p.status);
  const menu = menuFor
    ? [
        ...(canPublish(menuFor)
          ? [{ label: 'Publish now', icon: 'cloud-upload-outline', onPress: () => publish.mutate(menuFor.id, { onSuccess: (res) => setNotice({ tone: res.post.status === 'failed' ? 'danger' : 'success', text: `Post is ${res.post.status}.` }), onError: fail('Could not publish') }) }]
          : []),
        { label: 'Edit caption', icon: 'create-outline', onPress: () => { setForm((f) => ({ ...f, caption: menuFor.caption ?? '' })); setFormError(null); setSheet({ edit: menuFor }); } },
        { label: 'Delete', icon: 'trash-outline', danger: true, onPress: () => confirmDelete(menuFor) },
      ]
    : [];

  const header = (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <Banner tone={notice?.tone} message={notice?.text} />
      {connection.isError ? <Banner message={connection.error.message} /> : null}
      <Card style={{ gap: spacing.sm }}>
        {conn ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="logo-facebook" size={22} color="#1877f2" />
              <Text style={{ flex: 1, fontWeight: '700' }} numberOfLines={1}>{conn.page_name}</Text>
              <Badge tone="success" label={conn.status} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="logo-instagram" size={22} color="#c13584" />
              <Text style={{ flex: 1 }} numberOfLines={1}>{conn.instagram_linked ? `@${conn.ig_username}` : 'No Instagram account linked to this Page'}</Text>
            </View>
            {canManage ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {conn.instagram_linked ? null : (
                  <Button title="Re-check Instagram" variant="outline" loading={recheck.isPending} style={{ flex: 1 }} onPress={() => recheck.mutate(undefined, { onSuccess: (res) => note(res, 'Checked.'), onError: fail('Could not check') })} />
                )}
                <Button title="Disconnect" variant="ghost" style={{ flex: 1 }} onPress={confirmDisconnect} />
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={{ fontWeight: '600' }}>No Facebook Page connected</Text>
            <Text variant="small" muted>Connect a Page (and its Instagram Business account) to publish photos and videos from Heltog.</Text>
            {canManage ? <Button title="Connect Facebook Page" onPress={() => { setForm({ page_id: '', token: '', caption: '' }); setFormError(null); setSheet('connect'); }} /> : <Text variant="caption" muted>Ask an admin to connect a Page.</Text>}
          </>
        )}
      </Card>
      <Text variant="subheading">Posts</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={posts.isRefetching || connection.isRefetching} onRefresh={() => { posts.refetch(); connection.refetch(); }} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={<Text muted style={{ textAlign: 'center', padding: spacing.lg }}>{posts.isError ? posts.error.message : 'No posts yet.'}</Text>}
        contentContainerStyle={{ paddingBottom: 96 }}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {item.media_type === 'video' || !item.image_url ? (
              <View style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={item.media_type === 'video' ? 'videocam' : 'image'} size={28} color={colors.primary} />
              </View>
            ) : (
              <Image source={{ uri: item.image_url }} contentFit="cover" style={{ width: 72, height: 72, borderRadius: 10 }} />
            )}
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Badge tone={STATUS_TONE[item.status] ?? 'muted'} label={item.status} />
                {item.targets.map((t) => <Text key={t} variant="caption" muted>{PLATFORM[t] ?? t}</Text>)}
              </View>
              <Text variant="small" numberOfLines={2}>{item.caption || 'No caption'}</Text>
              <Text variant="caption" muted>
                {item.status === 'scheduled' && item.scheduled_at ? `Goes out ${formatListTime(item.scheduled_at)}` : item.published_at ? `Posted ${formatListTime(item.published_at)}` : formatListTime(item.created_at)}
              </Text>
              {Object.entries(item.results ?? {}).filter(([, r]) => r.status === 'failed').map(([platform, r]) => (
                <Text key={platform} variant="caption" color={colors.danger}>{PLATFORM[platform] ?? platform}: {r.error ?? 'failed'}</Text>
              ))}
            </View>
            {canPost ? (
              <Pressable onPress={() => setMenuFor(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Post actions">
                <Ionicons name="ellipsis-vertical" size={20} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        )}
      />

      <ActionSheet visible={!!menuFor} title="Post" actions={menu} onClose={() => setMenuFor(null)} />

      <Sheet visible={!!sheet} title={sheet === 'connect' ? 'Connect Facebook Page' : 'Edit caption'} onClose={() => setSheet(null)}>
        <Banner message={formError?.message && !fieldError(formError, 'page_id') ? formError.message : null} />
        {sheet === 'connect' ? (
          <>
            <Text variant="small" muted style={{ marginBottom: spacing.md }}>
              Use the Page ID and a Page access token with pages_manage_posts, pages_read_engagement and instagram_content_publish permissions. The token is stored encrypted on the server.
            </Text>
            <Input label="Page ID" value={form.page_id} onChangeText={(v) => setForm((f) => ({ ...f, page_id: v }))} keyboardType="number-pad" error={fieldError(formError, 'page_id')} />
            <Input label="Page access token" password value={form.token} onChangeText={(v) => setForm((f) => ({ ...f, token: v }))} autoCorrect={false} error={fieldError(formError, 'page_access_token')} />
          </>
        ) : (
          <Input label="Caption" value={form.caption} onChangeText={(v) => setForm((f) => ({ ...f, caption: v }))} multiline maxLength={2200} style={{ minHeight: 120, textAlignVertical: 'top' }} error={fieldError(formError, 'caption')} />
        )}
        <Button title={sheet === 'connect' ? 'Connect' : 'Save caption'} loading={connect.isPending || update.isPending} onPress={submitSheet} />
      </Sheet>

      {canPost && conn ? (
        <Pressable
          onPress={() => router.push('/social-post-form')}
          accessibilityRole="button"
          accessibilityLabel="New post"
          style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}
