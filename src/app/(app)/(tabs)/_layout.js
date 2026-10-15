import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/features/auth/AuthProvider';
import { can } from '@/lib/permissions';
import { headerTitleFont, tabLabelFont } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';

// Tab icon: filled and slightly lifted while its tab is active, with a small spring when it changes.
function AnimatedTabIcon({ name, color, size, focused }) {
  const lift = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    lift.set(withSpring(focused ? 1 : 0, { damping: 12, stiffness: 240 }));
  }, [focused, lift]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.16 * lift.get() }, { translateY: -2 * lift.get() }] }));
  return (
    <Animated.View style={style}>
      <Ionicons name={focused ? name.replace('-outline', '') : name} size={size} color={color} />
    </Animated.View>
  );
}

function icon(name) {
  function TabIcon({ color, size, focused }) {
    return <AnimatedTabIcon name={name} color={color} size={size} focused={focused} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const user = useUser();
  const { colors } = useTheme();
  // Super admins are platform accounts with no tenant: they get Companies and Plans instead of the workspace tabs.
  const tenantUser = !user.is_super_admin;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryDark },
        headerTintColor: '#fff',
        headerTitleStyle: headerTitleFont,
        tabBarLabelStyle: tabLabelFont,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: icon('grid-outline') }} />
      <Tabs.Protected guard={tenantUser && can(user, 'conversations.view')}>
        <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarIcon: icon('chatbubbles-outline') }} />
      </Tabs.Protected>
      <Tabs.Protected guard={tenantUser && can(user, 'contacts.view')}>
        <Tabs.Screen name="contacts" options={{ title: 'Contacts', tabBarIcon: icon('people-outline') }} />
      </Tabs.Protected>
      <Tabs.Protected guard={tenantUser && can(user, 'campaigns.view')}>
        <Tabs.Screen name="campaigns" options={{ title: 'Campaigns', tabBarIcon: icon('megaphone-outline') }} />
      </Tabs.Protected>
      <Tabs.Protected guard={!tenantUser}>
        <Tabs.Screen name="companies" options={{ title: 'Companies', tabBarIcon: icon('business-outline') }} />
        <Tabs.Screen name="admin-plans" options={{ title: 'Plans', tabBarIcon: icon('pricetags-outline') }} />
      </Tabs.Protected>
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('menu-outline') }} />
    </Tabs>
  );
}
