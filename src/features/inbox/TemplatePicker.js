import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Button, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useApprovedTemplates } from './hooks';

const bodyOf = (t) => t.components?.find((c) => c.type?.toUpperCase() === 'BODY')?.text ?? null;

// Sheet listing approved templates. onSend({ name, language }) must return a promise.
export function TemplatePicker({ visible, onClose, onSend, sending, error }) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error: loadError, refetch } = useApprovedTemplates(visible);
  const [selectedId, setSelectedId] = useState(null);
  const templates = data?.templates ?? [];
  const selected = templates.find((t) => t.id === selectedId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View
          style={{
            maxHeight: '80%',
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            padding: spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text variant="subheading" style={{ flex: 1 }}>Send a template</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          <Text variant="small" muted style={{ marginBottom: spacing.md }}>
            The 24-hour window is closed. An approved template re-opens the conversation once the customer replies.
          </Text>
          <Banner message={error} />

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />
          ) : isError ? (
            <View>
              <Banner message={loadError.message} />
              <Button title="Retry" variant="outline" onPress={() => refetch()} />
            </View>
          ) : templates.length === 0 ? (
            <Text muted style={{ textAlign: 'center', margin: spacing.xl }}>No approved templates yet. Create one on the Templates page.</Text>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(t) => t.id}
              extraData={selectedId}
              style={{ flexGrow: 0, marginBottom: spacing.md }}
              renderItem={({ item }) => {
                const active = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => setSelectedId(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={{
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.chipBg : 'transparent',
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text style={{ fontWeight: '600' }}>{item.name}</Text>
                    <Text variant="caption" muted>{item.language}{item.category ? ` · ${item.category.toLowerCase()}` : ''}</Text>
                    {bodyOf(item) ? <Text variant="small" numberOfLines={3} style={{ marginTop: 4 }}>{bodyOf(item)}</Text> : null}
                  </Pressable>
                );
              }}
            />
          )}

          <Button
            title="Send template"
            disabled={!selected}
            loading={sending}
            onPress={() => selected && onSend({ name: selected.name, language: selected.language || 'en' })}
          />
        </View>
      </View>
    </Modal>
  );
}
