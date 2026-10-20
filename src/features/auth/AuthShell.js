import { useEffect } from 'react';
import { Image } from 'expo-image';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { LegalLinks } from '@/features/legal/LegalLinks';
import { useTheme } from '@/theme/ThemeProvider';

const HIGHLIGHTS = [
  { icon: 'chatbubbles', label: 'Shared inbox' },
  { icon: 'megaphone', label: 'Campaigns' },
  { icon: 'people', label: 'Team' },
];

// A big soft circle that drifts slowly up and down. Reanimated stops it by itself when the phone asks for less motion.
function Orb({ size, color, style, delay = 0 }) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.set(withRepeat(withSequence(withTiming(1, { duration: 5200 + delay }), withTiming(0, { duration: 5200 + delay })), -1));
  }, [drift, delay]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: drift.get() * 18 }, { scale: 1 + drift.get() * 0.04 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style, animated]} />;
}

// Shared frame for login / register / forgot / reset: a teal hero with the logo on top, and the form on a white sheet
// that slides up from the bottom. `hero` adds the tagline and feature chips (used on the main sign-in screens).
export function AuthShell({ title, subtitle, children, footer, legalPrefix, hero = false }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.primaryDark }}>
      <Orb size={340} color={colors.primaryLight + '33'} style={{ top: -120, right: -110 }} />
      <Orb size={240} color={colors.accent + '26'} style={{ top: 120, left: -120 }} delay={900} />
      <Orb size={180} color={colors.primary + '66'} style={{ top: 330, right: -60 }} delay={400} />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(550)} style={{ alignItems: 'center', paddingTop: hero ? spacing.xl : spacing.md, paddingHorizontal: spacing.xl, gap: spacing.md }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
                <Image source={require('../../../assets/logo.png')} contentFit="contain" accessibilityLabel="Heltog" style={{ width: hero ? 200 : 150, height: hero ? 78 : 58 }} />
              </View>
              {hero ? (
                <>
                  <Text variant="subheading" style={{ color: '#fff', textAlign: 'center', fontWeight: '600', maxWidth: 300 }}>
                    All your WhatsApp customers, in one place.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {HIGHLIGHTS.map((h) => (
                      <View key={h.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff1f', borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 6 }}>
                        <Ionicons name={h.icon} size={13} color="#fff" />
                        <Text variant="caption" style={{ color: '#fff', fontWeight: '600' }}>{h.label}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(120).duration(500)}
              style={{
                flexGrow: 1,
                marginTop: hero ? spacing.xl : spacing.lg,
                backgroundColor: colors.card,
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                paddingHorizontal: spacing.xl,
                paddingTop: spacing.xl + 4,
                paddingBottom: insets.bottom + spacing.xl,
              }}
            >
              <Text variant="title">{title}</Text>
              {subtitle ? <Text muted style={{ marginTop: spacing.xs, marginBottom: spacing.xl }}>{subtitle}</Text> : <View style={{ height: spacing.xl }} />}
              {children}
              {footer ? <View style={{ alignItems: 'center', marginTop: spacing.xl }}>{footer}</View> : null}
              <View style={{ flexGrow: 1, minHeight: spacing.xl }} />
              <LegalLinks color={colors.muted} linkColor={colors.primary} prefix={legalPrefix} />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
