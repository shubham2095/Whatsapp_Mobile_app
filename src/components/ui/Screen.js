import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

export function Screen({ children, scroll = false, padded = true, edges = ['top', 'bottom'], style }) {
  const { colors, spacing } = useTheme();
  const pad = padded ? spacing.lg : 0;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[{ flexGrow: 1, padding: pad }, style]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, padding: pad }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
