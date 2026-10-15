import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

const ToastContext = createContext(null);
const VISIBLE_MS = 2600;

const ICON = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' };

// toast.show('Copied') / toast.show('Could not save', 'error'): a short message that fades away by itself.
export function ToastProvider({ children }) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const [progress] = useState(() => new Animated.Value(0));
  const timer = useRef(null);

  const hide = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [progress]);

  const show = useCallback(
    (message, tone = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone, key: Date.now() });
      Animated.timing(progress, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, VISIBLE_MS);
    },
    [hide, progress],
  );

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show }), [show]);
  const tint = toast ? { success: colors.success, error: colors.danger, info: colors.primary }[toast.tone] : colors.primary;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            left: spacing.lg,
            right: spacing.lg,
            bottom: insets.bottom + 84, // above the tab bar
            opacity: progress,
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              alignSelf: 'center',
              maxWidth: '100%',
              backgroundColor: colors.text,
              borderRadius: radius.pill,
              paddingVertical: 10,
              paddingHorizontal: spacing.lg,
              elevation: 6,
            }}
          >
            <Ionicons name={ICON[toast.tone]} size={18} color={tint} />
            <Text variant="small" color={colors.bg} style={{ flexShrink: 1, fontWeight: '600' }}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
