import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Sheet, Text } from '@/components/ui';
import { useApprovedTemplates } from '@/features/inbox/hooks';
import { useTheme } from '@/theme/ThemeProvider';

// Field that opens a list of approved templates. value / onChange use { id, name, language } or null.
export function TemplateSelect({ label = 'Template', value, onChange, error }) {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error: loadError } = useApprovedTemplates(open);
  const templates = data?.templates ?? [];

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, borderWidth: 1, borderColor: error ? colors.danger : colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.inputBg }}
      >
        <Ionicons name="document-text-outline" size={20} color={colors.muted} />
        <Text style={{ flex: 1 }} muted={!value} numberOfLines={1}>{value ? `${value.name} · ${value.language}` : 'Choose an approved template'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text variant="caption" color={colors.danger} style={{ marginTop: spacing.xs }}>{error}</Text> : null}

      <Sheet visible={open} title="Approved templates" onClose={() => setOpen(false)}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} /> : null}
        {isError ? <Banner message={loadError.message} /> : null}
        {!isLoading && !isError && templates.length === 0 ? (
          <Text muted style={{ textAlign: 'center', margin: spacing.xl }}>No approved templates yet. Create one and wait for Meta to approve it.</Text>
        ) : null}
        {templates.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => {
              onChange({ id: t.id, name: t.name, language: t.language || 'en' });
              setOpen(false);
            }}
            accessibilityRole="button"
            style={({ pressed }) => ({ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>{t.name}</Text>
            <Text variant="caption" muted>{t.language}{t.category ? ` · ${t.category.toLowerCase()}` : ''}</Text>
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}
