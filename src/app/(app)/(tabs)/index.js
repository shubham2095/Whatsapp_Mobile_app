import { View } from 'react-native';
import { Banner, Badge, Card, Screen, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { isPlanExpired, roleLabel } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

// Phase 1 landing screen. Real dashboard stats arrive in Phase 6.
export default function Dashboard() {
  const user = useUser();
  const { spacing } = useTheme();
  const company = user.tenant?.company_name ?? user.tenant?.name;
  const sub = user.subscription;

  return (
    <Screen scroll>
      <View style={{ gap: spacing.md }}>
        {isPlanExpired(user) ? (
          <Banner tone="warning" message="Your subscription has ended. Renew your plan to keep using WhatsApp features." />
        ) : null}
        <Text variant="heading">Hi, {user.name.split(' ')[0]}</Text>
        {company ? <Text muted>{company}</Text> : null}

        <Card style={{ gap: spacing.sm }}>
          <Text variant="small" muted>Role</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {user.roles.map((r) => <Badge key={r} label={roleLabel(r)} />)}
          </View>
        </Card>

        {sub ? (
          <Card style={{ gap: spacing.sm }}>
            <Text variant="small" muted>Plan</Text>
            <Text variant="subheading">{sub.plan_name ?? 'Plan'}</Text>
            <Badge tone={sub.status === 'active' || sub.status === 'trialing' ? 'success' : 'warning'} label={sub.status} />
            {sub.current_period_end ? (
              <Text variant="small" muted>Renews / ends {new Date(sub.current_period_end).toLocaleDateString()}</Text>
            ) : null}
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
