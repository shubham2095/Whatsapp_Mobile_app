import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge, Text } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { displayPhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

export const contactTitle = (c) => c.name || displayPhone(c.wa_id) || c.phone || 'Unknown';

export const tagsOf = (c) =>
  (c.tag_list ?? '')
    .split(/[,;|]/)
    .map((t) => t.trim())
    .filter(Boolean);

// Same bands as the web hot list.
export function priorityOf(score) {
  const n = score ?? 50;
  if (n >= 80) return { label: 'High', tone: 'danger' };
  if (n >= 50) return { label: 'Medium', tone: 'warning' };
  return { label: 'Low', tone: 'neutral' };
}

// `showHot`: hot-list mode, adds the AI priority badge, reason and age.
export const ContactRow = memo(function ContactRow({ contact, onPress, showHot = false }) {
  const { colors, spacing, radius } = useTheme();
  const title = contactTitle(contact);
  const tags = tagsOf(contact).filter((t) => t.toLowerCase() !== 'hot').slice(0, 3);
  const priority = priorityOf(contact.hot_score);

  return (
    <Pressable
      onPress={() => onPress(contact)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: pressed ? colors.chipBg : colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      })}
    >
      <Avatar name={title} size={46} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, fontWeight: '600' }}>{title}</Text>
          {contact.is_hot && !showHot ? <Ionicons name="flame" size={15} color={colors.accent} /> : null}
          {contact.is_blocked ? <Ionicons name="ban" size={14} color={colors.danger} /> : null}
        </View>
        {contact.name ? <Text variant="small" muted>{displayPhone(contact.wa_id) || contact.phone}</Text> : null}

        {showHot ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 }}>
            <Badge tone={priority.tone} label={`${priority.label} · ${contact.hot_score ?? 50}`} />
            <Text variant="caption" muted>{timeAgo(contact.hot_at)}</Text>
          </View>
        ) : null}
        {showHot && contact.hot_reason ? <Text variant="small" numberOfLines={2} style={{ marginTop: 2 }}>{contact.hot_reason}</Text> : null}

        {tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {tags.map((t) => (
              <View key={t} style={{ backgroundColor: colors.chipBg, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text variant="caption" color={colors.primary}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
