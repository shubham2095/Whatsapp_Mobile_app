import { useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { onlineManager } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useServerBusy } from '@/lib/polling';
import { useTheme } from '@/theme/ThemeProvider';

export const useIsOnline = () => useSyncExternalStore(onlineManager.subscribe, () => onlineManager.isOnline());

// A small pill under the header while the phone has no internet. Screens keep showing their
// saved data, and refresh by themselves when the connection returns.
export function OfflineIndicator() {
  const online = useIsOnline();
  const busy = useServerBusy();
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  if (online && !busy) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 58, left: 0, right: 0, alignItems: 'center' }}>
      <View
        accessibilityLiveRegion="polite"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.warning, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: spacing.md, elevation: 4 }}
      >
        <Ionicons name={online ? 'hourglass-outline' : 'cloud-offline'} size={14} color="#fff" />
        <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>{online ? 'Server is busy. Retrying shortly.' : 'Offline. Showing saved data.'}</Text>
      </View>
    </View>
  );
}
