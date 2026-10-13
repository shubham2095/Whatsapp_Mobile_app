import { memo } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Text } from '@/components/ui';
import { formatDuration, formatFileSize, formatTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

const READ_BLUE = '#53bdeb';

function StatusTicks({ status }) {
  const { colors } = useTheme();
  if (status === 'failed') return <Ionicons name="alert-circle" size={14} color={colors.danger} />;
  if (status === 'read') return <Ionicons name="checkmark-done" size={15} color={READ_BLUE} />;
  if (status === 'delivered') return <Ionicons name="checkmark-done" size={15} color={colors.muted} />;
  if (status === 'sent') return <Ionicons name="checkmark" size={15} color={colors.muted} />;
  return <Ionicons name="time-outline" size={13} color={colors.muted} />;
}

function AudioAttachment({ url }) {
  const { colors, spacing } = useTheme();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);

  function toggle() {
    if (status.playing) {
      player.pause();
      return;
    }
    // Restart from the top once a clip has played to the end.
    if (status.duration > 0 && status.currentTime >= status.duration - 0.2) player.seekTo(0);
    player.play();
  }

  const shown = status.playing || status.currentTime > 0 ? status.currentTime : status.duration;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 190 }}>
      <Pressable onPress={toggle} hitSlop={8} accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause voice note' : 'Play voice note'}>
        <Ionicons name={status.playing ? 'pause-circle' : 'play-circle'} size={38} color={colors.primary} />
      </Pressable>
      <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: `${status.duration ? Math.min(100, (status.currentTime / status.duration) * 100) : 0}%` }} />
      </View>
      <Text variant="caption" muted>{formatDuration(shown || 0)}</Text>
    </View>
  );
}

function FileAttachment({ attachment, icon }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={() => attachment.url && Linking.openURL(attachment.url)}
      accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bg + '99', borderRadius: radius.sm, padding: spacing.sm, minWidth: 190 }}
    >
      <Ionicons name={icon} size={28} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} variant="small" style={{ fontWeight: '600' }}>{attachment.file_name || 'File'}</Text>
        {attachment.file_size ? <Text variant="caption" muted>{formatFileSize(attachment.file_size)}</Text> : null}
      </View>
      <Ionicons name="open-outline" size={18} color={colors.muted} />
    </Pressable>
  );
}

function Attachment({ message, attachment, onOpenImage }) {
  const { radius } = useTheme();
  const type = attachment.type || message.type;
  if (type === 'image' || type === 'sticker') {
    return (
      <Pressable onPress={() => onOpenImage(attachment.url)} accessibilityRole="imagebutton" accessibilityLabel="Open image">
        <Image source={{ uri: attachment.url }} contentFit="cover" transition={150} style={{ width: 230, height: 230, borderRadius: radius.sm }} />
      </Pressable>
    );
  }
  if (type === 'audio') return <AudioAttachment url={attachment.url} />;
  if (type === 'video') return <FileAttachment attachment={{ ...attachment, file_name: attachment.file_name || 'Video' }} icon="videocam-outline" />;
  return <FileAttachment attachment={attachment} icon="document-text-outline" />;
}

// The backend stores "[Image]"-style placeholders as the body of caption-less media.
const isPlaceholder = (body) => !body || /^\[[^\]]+\]$/.test(body.trim());

export const MessageBubble = memo(function MessageBubble({ message, onLongPress, onOpenImage }) {
  const { colors, radius, spacing } = useTheme();
  const outbound = message.direction === 'outbound';
  const attachment = message.attachments?.find((a) => a.url);
  const failed = message.status === 'failed';
  const caption = attachment ? attachment.caption || (isPlaceholder(message.body) ? null : message.body) : null;
  const text = attachment ? caption : message.body || `[${message.type}]`;

  return (
    <View style={{ alignItems: outbound ? 'flex-end' : 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 2 }}>
      <Pressable
        onLongPress={() => onLongPress(message)}
        delayLongPress={300}
        style={{
          maxWidth: '82%',
          backgroundColor: outbound ? colors.bubbleOut : colors.bubbleIn,
          borderRadius: radius.md,
          borderTopRightRadius: outbound ? 4 : radius.md,
          borderTopLeftRadius: outbound ? radius.md : 4,
          paddingHorizontal: spacing.sm + 2,
          paddingTop: spacing.sm,
          paddingBottom: 4,
          gap: 4,
          borderWidth: failed ? 1 : 0,
          borderColor: colors.danger,
        }}
      >
        {message.type === 'template' ? <Text variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>TEMPLATE</Text> : null}
        {attachment ? <Attachment message={message} attachment={attachment} onOpenImage={onOpenImage} /> : null}
        {text ? <Text selectable={false}>{text}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 3 }}>
          <Text variant="caption" muted>{formatTime(message.created_at)}</Text>
          {outbound ? <StatusTicks status={message.status} /> : null}
        </View>
      </Pressable>
      {failed && message.error_message ? (
        <Text variant="caption" color={colors.danger} style={{ maxWidth: '82%', marginTop: 2 }}>{message.error_message}</Text>
      ) : null}
    </View>
  );
});
