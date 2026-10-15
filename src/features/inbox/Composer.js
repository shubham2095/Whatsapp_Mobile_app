import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionSheet, Banner, Button, Text } from '@/components/ui';
import { formatDuration, formatFileSize, formatRemaining } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { useSendMedia, useSendTemplate } from './hooks';
import { pickDocument, pickFromGallery, takePhoto } from './pickMedia';
import { TemplatePicker } from './TemplatePicker';
import { useVoiceRecorder } from './useVoiceRecorder';

const MEDIA_ICON = { image: 'image-outline', video: 'videocam-outline', audio: 'mic-outline', document: 'document-text-outline' };

// onSendText(body) hands a text message to the chat's outbox (it shows at once and can be retried).
// windowEndsAt: when the customer's 24-hour reply window closes (ms), or null if unknown.
export function Composer({ conversationId, windowOpen, onSendText, windowEndsAt = null }) {
  const { colors, radius, spacing, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const sendMedia = useSendMedia(conversationId);
  const sendTemplate = useSendTemplate(conversationId);
  const voice = useVoiceRecorder();
  const now = useNow(30_000);

  const [text, setText] = useState('');
  const [pending, setPending] = useState(null); // file waiting to be sent
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const busy = sendMedia.isPending;
  const canSend = !busy && (pending || text.trim().length > 0);

  function fail(e) {
    setNotice(null);
    setError(e.message || 'Could not send. Try again.');
  }

  async function attach(picker) {
    setError(null);
    const result = await picker();
    if (!result) return;
    if (result.error) setError(result.error);
    else setPending(result.file);
  }

  function send() {
    if (!canSend) return;
    setError(null);
    setNotice(null);
    if (pending) {
      const caption = pending.mediaType === 'audio' ? undefined : text.trim() || undefined;
      sendMedia.mutate(
        { file: pending, mediaType: pending.mediaType, caption },
        {
          onSuccess: () => {
            setPending(null);
            setText('');
          },
          onError: fail,
        },
      );
      return;
    }
    // The message appears in the chat immediately; if it fails the chat offers to send it again.
    onSendText(text.trim());
    setText('');
  }

  async function startRecording() {
    setError(null);
    const res = await voice.start();
    if (res.error) setError(res.error);
  }

  async function stopRecording() {
    const res = await voice.stop();
    if (res.error) setError(res.error);
    else setPending(res.file);
  }

  async function sendTemplateNow(template) {
    setError(null);
    try {
      await sendTemplate.mutateAsync(template);
      setTemplatesOpen(false);
      setNotice('Template sent. You can reply freely once the customer responds.');
    } catch (e) {
      setError(e.message);
    }
  }

  const containerStyle = {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Math.max(insets.bottom, spacing.sm),
  };

  if (!windowOpen) {
    return (
      <View style={containerStyle}>
        <Banner tone="success" message={notice} />
        <Banner message={templatesOpen ? null : error} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <Ionicons name="lock-closed" size={16} color={colors.muted} />
          <Text variant="small" muted style={{ flex: 1 }}>
            24-hour window closed. Send an approved template to start the conversation again.
          </Text>
        </View>
        <Button title="Choose template" variant="secondary" onPress={() => setTemplatesOpen(true)} />
        <TemplatePicker
          visible={templatesOpen}
          onClose={() => setTemplatesOpen(false)}
          onSend={sendTemplateNow}
          sending={sendTemplate.isPending}
          error={templatesOpen ? error : null}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Banner message={error} />
      <Banner tone="success" message={notice} />

      {windowEndsAt && windowEndsAt > now ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs }}>
          <Ionicons name="time-outline" size={14} color={windowEndsAt - now < 2 * 3600 * 1000 ? colors.warning : colors.muted} />
          <Text variant="caption" color={windowEndsAt - now < 2 * 3600 * 1000 ? colors.warning : colors.muted} style={{ fontWeight: windowEndsAt - now < 2 * 3600 * 1000 ? '700' : '400' }}>
            Free replies close in {formatRemaining(windowEndsAt - now)}
          </Text>
        </View>
      ) : null}

      {pending ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm }}>
          {pending.mediaType === 'image' ? (
            <Image source={{ uri: pending.uri }} contentFit="cover" style={{ width: 52, height: 52, borderRadius: radius.sm }} />
          ) : (
            <View style={{ width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={MEDIA_ICON[pending.mediaType]} size={26} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} variant="small" style={{ fontWeight: '600' }}>{pending.name}</Text>
            <Text variant="caption" muted>
              {pending.mediaType === 'audio' && pending.seconds ? `Voice note · ${formatDuration(pending.seconds)}` : [pending.mediaType, formatFileSize(pending.size)].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Pressable onPress={() => setPending(null)} hitSlop={10} accessibilityLabel="Remove attachment">
            <Ionicons name="close-circle" size={24} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      {voice.recording ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs }}>
          <Pressable onPress={voice.cancel} hitSlop={10} accessibilityLabel="Discard recording">
            <Ionicons name="trash-outline" size={26} color={colors.danger} />
          </Pressable>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} />
          <Text style={{ flex: 1, color: colors.danger, fontWeight: '600' }}>Recording {formatDuration(voice.seconds)}</Text>
          <Pressable
            onPress={stopRecording}
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="stop" size={22} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
          <Pressable onPress={() => setAttachOpen(true)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Attach" style={{ height: 44, justifyContent: 'center' }}>
            <Ionicons name="attach" size={28} color={colors.muted} />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={(v) => {
              setText(v);
              if (error) setError(null);
            }}
            placeholder={pending ? 'Add a caption' : 'Message'}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={4096}
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 44,
              backgroundColor: colors.bg,
              color: colors.text,
              borderRadius: 22,
              paddingHorizontal: spacing.md,
              paddingTop: 11,
              paddingBottom: 11,
              fontSize: fontSize.md,
            }}
          />
          {canSend || busy ? (
            <Pressable
              onPress={send}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: canSend ? 1 : 0.6 }}
            >
              <Ionicons name={busy ? 'hourglass-outline' : 'send'} size={20} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              onPress={startRecording}
              accessibilityRole="button"
              accessibilityLabel="Record voice note"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="mic" size={22} color="#fff" />
            </Pressable>
          )}
        </View>
      )}

      <ActionSheet
        visible={attachOpen}
        title="Attach"
        onClose={() => setAttachOpen(false)}
        actions={[
          { label: 'Camera', icon: 'camera-outline', onPress: () => attach(takePhoto) },
          { label: 'Photo or video', icon: 'images-outline', onPress: () => attach(pickFromGallery) },
          { label: 'Document', icon: 'document-outline', onPress: () => attach(pickDocument) },
        ]}
      />
    </View>
  );
}
