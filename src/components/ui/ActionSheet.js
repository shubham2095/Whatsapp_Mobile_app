import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// Bottom sheet menu. actions: [{ label, icon, onPress, danger }]
export function ActionSheet({ visible, title, actions, onClose }) {
  const { colors, radius, spacing, touch } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.sheet,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.md,
            paddingHorizontal: spacing.lg,
          }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.handle, marginBottom: spacing.md }} />
          {title ? <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>{title}</Text> : null}
          {actions.map((a, i) => (
            <Pressable
              key={a.label}
              onPress={() => {
                onClose();
                // Let the sheet finish closing first (iOS cannot present a picker over a dismissing modal).
                setTimeout(a.onPress, 250);
              }}
              accessibilityRole="button"
              android_ripple={{ color: colors.primary + '22' }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                minHeight: touch + 8,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.border,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              {a.icon ? <Ionicons name={a.icon} size={22} color={a.danger ? colors.danger : colors.primary} /> : <View style={{ width: 22 }} />}
              <Text style={{ color: a.danger ? colors.danger : colors.text, fontWeight: '500' }}>{a.label}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
