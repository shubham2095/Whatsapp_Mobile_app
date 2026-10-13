import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { DateTimeField } from '@/components/DateTimeField';
import { Banner, Button, CheckList, Input, Screen, Text } from '@/components/ui';
import { useCreatePost, usePublishPost, useSocialConnection } from '@/features/automation/hooks';
import { formatFileSize } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

const MAX_BYTES = 200 * 1024 * 1024; // the backend accepts up to 200 MB

export default function SocialPostForm() {
  const { colors, radius, spacing } = useTheme();
  const connection = useSocialConnection();
  const create = useCreatePost();
  const publish = usePublishPost();
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [targets, setTargets] = useState(['facebook']);
  const [when, setWhen] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(null); // 'uploading' | 'publishing'

  const igLinked = connection.data?.connection?.instagram_linked;
  const items = [{ key: 'facebook', label: 'Facebook Page' }, ...(igLinked ? [{ key: 'instagram', label: 'Instagram' }] : [])];

  async function pick(fromCamera) {
    setError(null);
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return setError('Allow camera access in Settings to take a photo.');
    }
    const launch = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await launch({ mediaTypes: ['images', 'videos'], quality: 0.9 });
    if (res.canceled || !res.assets?.length) return undefined;
    const a = res.assets[0];
    if (a.fileSize && a.fileSize > MAX_BYTES) return setError('That file is larger than 200 MB.');
    const isVideo = a.type === 'video';
    setMedia({ uri: a.uri, name: a.fileName || `post-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`, mimeType: a.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'), size: a.fileSize, isVideo });
    return undefined;
  }

  // mode: 'publish' (post immediately) | 'save' (draft, or scheduled when a time is set)
  async function submit(mode) {
    setError(null);
    if (!media) return setError('Choose a photo or video first.');
    if (targets.length === 0) return setError('Choose at least one place to post.');
    if (when && when.getTime() <= Date.now()) return setError('Pick a time in the future.');

    try {
      setStep('uploading');
      const res = await create.mutateAsync({ caption: caption.trim() || undefined, image: media, targets, scheduledAt: when ? when.toISOString() : undefined });
      if (mode === 'publish') {
        setStep('publishing');
        const out = await publish.mutateAsync(res.post.id);
        if (out.post.status === 'failed') Alert.alert('Post failed', 'Meta rejected the post. Open it in the list to see why, then try again.');
      }
      router.back();
    } catch (e) {
      setError(e.message);
    } finally {
      setStep(null);
    }
    return undefined;
  }

  if (connection.isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  const busy = step !== null;

  return (
    <Screen scroll edges={['bottom']}>
      <Banner message={error} />

      {media ? (
        <View style={{ marginBottom: spacing.md, gap: spacing.sm }}>
          {media.isVideo ? (
            <View style={{ height: 160, borderRadius: radius.md, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="videocam" size={40} color={colors.primary} />
              <Text variant="small" muted>{media.name}{media.size ? ` · ${formatFileSize(media.size)}` : ''}</Text>
            </View>
          ) : (
            <Image source={{ uri: media.uri }} contentFit="cover" style={{ height: 220, borderRadius: radius.md }} />
          )}
          <Button title="Choose a different file" variant="ghost" onPress={() => pick(false)} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <Pressable onPress={() => pick(false)} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', gap: 6, padding: spacing.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radius.md }}>
            <Ionicons name="images-outline" size={28} color={colors.primary} />
            <Text variant="small" color={colors.primary} style={{ fontWeight: '600' }}>Photo or video</Text>
          </Pressable>
          <Pressable onPress={() => pick(true)} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', gap: 6, padding: spacing.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radius.md }}>
            <Ionicons name="camera-outline" size={28} color={colors.primary} />
            <Text variant="small" color={colors.primary} style={{ fontWeight: '600' }}>Camera</Text>
          </Pressable>
        </View>
      )}

      <Input label="Caption" value={caption} onChangeText={setCaption} multiline maxLength={2200} placeholder="Write something..." style={{ minHeight: 110, textAlignVertical: 'top' }} />
      <CheckList label="Post to" items={items} value={targets} onChange={setTargets} />
      {igLinked ? null : <Text variant="caption" muted style={{ marginTop: -8, marginBottom: spacing.md }}>Instagram is not linked to this Page, so only Facebook is available.</Text>}

      <DateTimeField label="Schedule (optional)" value={when} onChange={setWhen} />

      {when ? (
        <Button title="Schedule post" loading={step === 'uploading'} disabled={busy} onPress={() => submit('save')} />
      ) : (
        <>
          <Button title={step === 'publishing' ? 'Publishing...' : 'Publish now'} loading={busy} onPress={() => submit('publish')} />
          <Button title="Save as draft" variant="outline" disabled={busy} onPress={() => submit('save')} style={{ marginTop: spacing.sm }} />
        </>
      )}
      {busy ? <Text variant="caption" muted style={{ textAlign: 'center', marginTop: spacing.sm }}>{step === 'uploading' ? 'Uploading, keep the app open...' : 'Sending to Meta...'}</Text> : null}
    </Screen>
  );
}
