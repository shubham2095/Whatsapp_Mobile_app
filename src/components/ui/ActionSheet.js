import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

// Bottom sheet menu. actions: [{ label, icon, onPress, danger }]
export function ActionSheet({ visible, title, actions, onClose }) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            paddingHorizontal: spacing.lg,
          }}
        >
          {title ? <Text variant="small" muted style={{ marginBottom: spacing.sm }}>{title}</Text> : null}
          {actions.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => {
                onClose();
                // Let the sheet finish closing first (iOS cannot present a picker over a dismissing modal).
                setTimeout(a.onPress, 250);
              }}
              accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, opacity: pressed ? 0.6 : 1 })}
            >
              {a.icon ? <Ionicons name={a.icon} size={22} color={a.danger ? colors.danger : colors.primary} /> : <View style={{ width: 22 }} />}
              <Text style={{ color: a.danger ? colors.danger : colors.text }}>{a.label}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
