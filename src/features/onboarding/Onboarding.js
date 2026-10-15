import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { haptics } from '@/lib/haptics';
import { getOnboardingSeen, saveOnboardingSeen } from '@/lib/storage';
import { useTheme } from '@/theme/ThemeProvider';

const SLIDES = [
  {
    icon: 'chatbubbles',
    title: 'Every customer chat in one inbox',
    text: 'Reply, hand chats to a teammate and keep important ones on top. Swipe a chat to pin it or mark it read.',
  },
  {
    icon: 'megaphone',
    title: 'Reach many people at once',
    text: 'Send approved templates to your contacts as a campaign or a quick bulk message. Import contacts from your phone or a CSV file.',
  },
  {
    icon: 'notifications',
    title: 'Never miss a message',
    text: 'Allow notifications and you will hear about new customer messages as soon as they arrive, even when the app is closed.',
  },
];

// Three welcome slides, shown once per phone to company users after they first sign in.
export function Onboarding() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef(null);
  const [seen, setSeen] = useState(true); // assume seen until storage says otherwise, so nothing flashes
  const [page, setPage] = useState(0);

  useEffect(() => {
    let alive = true;
    getOnboardingSeen().then((value) => alive && setSeen(value));
    return () => {
      alive = false;
    };
  }, []);

  if (seen || !user || user.is_super_admin) return null;

  const last = page === SLIDES.length - 1;

  function finish() {
    haptics.success();
    setSeen(true);
    saveOnboardingSeen().catch(() => {});
  }

  function next() {
    if (last) return finish();
    haptics.select();
    listRef.current?.scrollToIndex({ index: page + 1, animated: true });
    return undefined;
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }}>
      <View style={{ alignItems: 'flex-end', padding: spacing.lg, minHeight: 56 }}>
        {last ? null : (
          <Pressable onPress={finish} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip welcome">
            <Text style={{ color: colors.muted, fontWeight: '600' }}>Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.icon}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_d, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item, index }) => (
          <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {index === page ? (
              <>
                <Animated.View
                  entering={ZoomIn.springify().damping(14)}
                  style={{ width: 132, height: 132, borderRadius: 66, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}
                >
                  <Ionicons name={item.icon} size={60} color={colors.primary} />
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(120).duration(300)} style={{ alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="heading" style={{ textAlign: 'center' }}>{item.title}</Text>
                  <Text muted style={{ textAlign: 'center', maxWidth: 320 }}>{item.text}</Text>
                </Animated.View>
              </>
            ) : null}
          </View>
        )}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: spacing.lg }}>
        {SLIDES.map((s, i) => (
          <View key={s.icon} style={{ width: i === page ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? colors.accent : colors.border }} />
        ))}
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <Button title={last ? 'Get started' : 'Next'} size="lg" onPress={next} />
      </View>
    </View>
  );
}
