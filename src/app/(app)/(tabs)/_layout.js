import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/features/auth/AuthProvider';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

function icon(name) {
  function TabIcon({ color, size }) {
    return <Ionicons name={name} size={size} color={color} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const user = useUser();
  const { colors } = useTheme();
  // Super admins are platform accounts with no tenant, so workspace tabs are hidden (as on the web).
  const tenantUser = !user.is_super_admin;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryDark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
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
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('menu-outline') }} />
    </Tabs>
  );
}
