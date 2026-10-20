import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { listCampaigns } from '@/api/campaigns';
import { listChatbots } from '@/api/chatbot';
import { listContacts } from '@/api/contacts';
import { listTemplates } from '@/api/templates';
import { Button, Card, ProgressBar, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useTeam } from '@/features/team/hooks';
import { can, hasFeature } from '@/lib/permissions';
import { useReadyAfter } from '@/lib/useReadyAfter';
import { useTheme } from '@/theme/ThemeProvider';
import { LIMIT_LABELS } from './planMeta';

// One request per number: ask for a single row and read the total from the page info.
const total = (fetchOne) => async () => (await fetchOne()).meta.total;
const COUNT_STALE_MS = 5 * 60_000;

// How much of the plan each feature has used, for the dashboard. Only shown for what the user is
// allowed to see; a limit of -1 / empty means unlimited.
export function UsageMeters() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const limits = user.plan_limits;
  // The dashboard's main numbers load first; these five small counts start a moment later so they do not compete.
  const ready = useReadyAfter();

  const canSee = {
    max_contacts: can(user, 'contacts.view'),
    max_campaigns: can(user, 'whatsapp.view'),
    max_templates: can(user, 'templates.view'),
    max_chatbots: can(user, 'whatsapp.view') && hasFeature(user, 'chatbot'),
    max_agents: can(user, 'team.view'),
  };
  const want = (key) => ready && !!limits && limits[key] !== undefined && canSee[key];

  const contacts = useQuery({ queryKey: ['contacts', 'count'], queryFn: total(() => listContacts({ perPage: 1 })), enabled: want('max_contacts'), staleTime: COUNT_STALE_MS });
  const campaigns = useQuery({ queryKey: ['campaigns', 'count'], queryFn: total(() => listCampaigns({ perPage: 1 })), enabled: want('max_campaigns'), staleTime: COUNT_STALE_MS });
  const templates = useQuery({ queryKey: ['templates', 'count'], queryFn: total(() => listTemplates({ perPage: 1 })), enabled: want('max_templates'), staleTime: COUNT_STALE_MS });
  const chatbots = useQuery({ queryKey: ['chatbots', 'count'], queryFn: total(() => listChatbots({ perPage: 1 })), enabled: want('max_chatbots'), staleTime: COUNT_STALE_MS });
  const team = useTeam(want('max_agents'));

  if (!limits) return null; // no plan limits to show (e.g. super admin)

  const used = {
    max_contacts: contacts.data,
    max_campaigns: campaigns.data,
    max_templates: templates.data,
    max_chatbots: chatbots.data,
    max_agents: team.data ? team.data.members.filter((m) => m.role === 'agent').length : undefined,
  };

  const rows = Object.keys(LIMIT_LABELS).filter((k) => want(k));
  if (rows.length === 0) return null;

  const nearLimit = rows.some((k) => {
    const cap = limits[k];
    return cap > 0 && used[k] !== undefined && used[k] / cap >= 0.9;
  });

  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="small" muted>Plan usage</Text>
      {rows.map((key) => {
        const cap = limits[key];
        const unlimited = cap === null || cap < 0;
        const count = used[key];
        const ratio = !unlimited && cap > 0 && count !== undefined ? count / cap : 0;
        const tone = ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'primary';
        return (
          <View key={key} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="small">{LIMIT_LABELS[key]}</Text>
              <Text variant="small" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }} color={ratio >= 1 ? colors.danger : undefined}>
                {count === undefined ? '...' : count.toLocaleString('en-IN')}
                {unlimited ? ' (unlimited)' : ` / ${cap.toLocaleString('en-IN')}`}
              </Text>
            </View>
            {unlimited ? null : cap === 0 ? <Text variant="caption" muted>Not included in your plan.</Text> : <ProgressBar value={count ?? 0} total={cap} tone={tone} />}
          </View>
        );
      })}
      {nearLimit ? (
        <>
          <Text variant="caption" color={colors.warning}>You are close to a plan limit. Upgrade to keep adding.</Text>
          {can(user, 'billing.manage') ? <Button title="See plans" variant="outline" onPress={() => router.push('/plans')} /> : null}
        </>
      ) : null}
    </Card>
  );
}
