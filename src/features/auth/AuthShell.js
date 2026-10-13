import { Image } from 'expo-image';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

// Shared frame for login / register / forgot / reset: teal backdrop, logo, form card.
export function AuthShell({ title, subtitle, children, footer }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryDark }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl }}>
            <Image source={require('../../../assets/logo.png')} contentFit="contain" style={{ width: '100%', height: 90, marginBottom: spacing.md }} />
            <Text variant="heading">{title}</Text>
            {subtitle ? <Text muted style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>{subtitle}</Text> : <View style={{ height: spacing.lg }} />}
            {children}
          </View>
          {footer ? <View style={{ alignItems: 'center', marginTop: spacing.lg }}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
