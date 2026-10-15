import { Pressable, View } from 'react-native';
import * as Updates from 'expo-updates';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

// Over-the-air updates download in the background. When one is ready this offers to restart into it,
// instead of waiting for the next time the app is opened. Never shown in Expo Go or development.
export function UpdateBanner() {
  const { isUpdatePending } = Updates.useUpdates();
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  if (!isUpdatePending) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 58, left: 0, right: 0, alignItems: 'center' }}>
      <Pressable
        onPress={() => Updates.reloadAsync().catch(() => {})}
        accessibilityRole="button"
        accessibilityLabel="Restart the app to use the new version"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: spacing.lg, elevation: 6 }}
      >
        <Ionicons name="sparkles" size={16} color="#fff" />
        <Text variant="small" style={{ color: '#fff', fontWeight: '700' }}>New version ready. Tap to restart.</Text>
      </Pressable>
    </View>
  );
}
