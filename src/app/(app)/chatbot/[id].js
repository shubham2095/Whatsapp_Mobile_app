import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Banner, Button, Card, ChipSelect, Input, Screen, Sheet, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import {
  useAddRule,
  useChatbot,
  useDeleteChatbot,
  useDeleteRule,
  useToggleChatbot,
  useUpdateRule,
} from '@/features/automation/hooks';
import { fieldError } from '@/lib/errors';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';

const MATCH_TYPES = [
  { value: 'contains', label: 'Contains' },
  { value: 'exact', label: 'Exact' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'regex', label: 'Regex' },
];
const RESPONSE_TYPES = [
  { value: 'text', label: 'Text reply' },
  { value: 'template', label: 'Template' },
];
const EMPTY_RULE = { keyword: '', match_type: 'contains', response_type: 'text', response_text: '', template_name: '', priority: '0', is_active: true };

export default function ChatbotDetail() {
  const { id } = useLocalSearchParams();
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch } = useChatbot(id);
  const toggle = useToggleChatbot();
  const remove = useDeleteChatbot();
  const addRule = useAddRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();
  const canManage = can(user, 'whatsapp.manage');

  const [editing, setEditing] = useState(null); // null = closed, { ...rule } for edit, EMPTY_RULE for new
  const [ruleId, setRuleId] = useState(null);
  const [ruleError, setRuleError] = useState(null);
  const [local, setLocal] = useState({});

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <Screen>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </Screen>
    );
  }

  const bot = data.chatbot;
  const rules = bot.rules ?? [];
  const set = (key) => (value) => setEditing((r) => ({ ...r, [key]: value }));
  const busy = addRule.isPending || updateRule.isPending;

  function openRule(rule) {
    setRuleError(null);
    setLocal({});
    setRuleId(rule?.id ?? null);
    setEditing(
      rule
        ? { keyword: rule.keyword, match_type: rule.match_type, response_type: rule.response_type, response_text: rule.response_text ?? '', template_name: rule.template_name ?? '', priority: String(rule.priority ?? 0), is_active: !!rule.is_active }
        : EMPTY_RULE,
    );
  }

  function saveRule() {
    const p = {};
    if (!editing.keyword.trim()) p.keyword = 'Enter the word or phrase to look for.';
    if (editing.response_type === 'text' && !editing.response_text.trim()) p.response_text = 'Enter the reply to send.';
    if (editing.response_type === 'template' && !editing.template_name.trim()) p.template_name = 'Enter the template name to send.';
    if (!/^\d+$/.test(editing.priority || '0')) p.priority = 'Use a whole number (0 is checked first).';
    setLocal(p);
    setRuleError(null);
    if (Object.keys(p).length) return;

    const body = {
      keyword: editing.keyword.trim(),
      match_type: editing.match_type,
      response_type: editing.response_type,
      response_text: editing.response_type === 'text' ? editing.response_text.trim() : null,
      template_name: editing.response_type === 'template' ? editing.template_name.trim() : null,
      priority: Number(editing.priority || 0),
      is_active: editing.is_active,
    };
    const done = { onSuccess: () => setEditing(null), onError: setRuleError };
    if (ruleId) updateRule.mutate({ id: bot.id, ruleId, ...body }, done);
    else addRule.mutate({ id: bot.id, ...body }, done);
  }

  function confirmDeleteRule(rule) {
    Alert.alert('Delete rule', `Remove the rule for "${rule.keyword}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRule.mutate({ id: bot.id, ruleId: rule.id }, { onError: (e) => Alert.alert('Could not delete', e.message) }) },
    ]);
  }

  function confirmDeleteBot() {
    Alert.alert('Delete chatbot', `"${bot.name}" and all its rules will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(bot.id, { onSuccess: () => router.back(), onError: (e) => Alert.alert('Could not delete', e.message) }) },
    ]);
  }

  const known = ['keyword', 'response_text', 'template_name', 'priority'];
  const sheetBanner = ruleError && !known.some((k) => fieldError(ruleError, k)) ? ruleError.message : null;

  return (
    <>
      <Screen scroll edges={['bottom']}>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Text variant="heading" style={{ flex: 1 }}>{bot.name}</Text>
            {canManage ? (
              <Switch value={bot.is_active} disabled={toggle.isPending} onValueChange={() => toggle.mutate(bot.id, { onError: (e) => Alert.alert('Could not update', e.message) })} trackColor={{ true: colors.primary, false: colors.border }} />
            ) : (
              <Badge tone={bot.is_active ? 'success' : 'muted'} label={bot.is_active ? 'On' : 'Off'} />
            )}
          </View>
          <Text variant="small" muted>{bot.phone_number ? `Runs on ${bot.phone_number.display_phone_number}` : 'Runs on all numbers'}</Text>

          {bot.welcome_message || bot.fallback_message || bot.ai_enabled ? (
            <Card style={{ gap: spacing.sm }}>
              {bot.welcome_message ? <View><Text variant="caption" muted>Welcome message</Text><Text variant="small">{bot.welcome_message}</Text></View> : null}
              {bot.fallback_message ? <View><Text variant="caption" muted>Fallback message</Text><Text variant="small">{bot.fallback_message}</Text></View> : null}
              {bot.ai_enabled ? <Badge tone="accent" label="AI replies on" /> : null}
            </Card>
          ) : null}

          {canManage ? <Button title="Edit bot settings" variant="outline" onPress={() => router.push({ pathname: '/chatbot-form', params: { id: bot.id } })} /> : null}

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="subheading" style={{ flex: 1 }}>Keyword rules ({rules.length})</Text>
            {canManage ? <Button title="Add rule" onPress={() => openRule(null)} style={{ minHeight: 40, paddingVertical: 6 }} /> : null}
          </View>

          {rules.length === 0 ? <Text muted>No rules yet. When a message matches a rule, the bot sends its reply.</Text> : null}
          {rules.map((r) => (
            <Card key={r.id} style={{ gap: 4, opacity: r.is_active ? 1 : 0.6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ flex: 1, fontWeight: '700' }} numberOfLines={1}>{r.keyword}</Text>
                <Badge label={MATCH_TYPES.find((m) => m.value === r.match_type)?.label ?? r.match_type} />
                {canManage ? (
                  <>
                    <Pressable onPress={() => openRule(r)} hitSlop={8} accessibilityLabel="Edit rule"><Ionicons name="create-outline" size={20} color={colors.muted} /></Pressable>
                    <Pressable onPress={() => confirmDeleteRule(r)} hitSlop={8} accessibilityLabel="Delete rule"><Ionicons name="trash-outline" size={20} color={colors.muted} /></Pressable>
                  </>
                ) : null}
              </View>
              <Text variant="small" numberOfLines={3}>{r.response_type === 'template' ? `Template: ${r.template_name}` : r.response_text}</Text>
              <Text variant="caption" muted>Priority {r.priority}{r.is_active ? '' : ' · off'}</Text>
            </Card>
          ))}

          {canManage ? <Button title="Delete chatbot" variant="danger" loading={remove.isPending} onPress={confirmDeleteBot} style={{ marginTop: spacing.md }} /> : null}
        </View>
      </Screen>

      <Sheet visible={!!editing} title={ruleId ? 'Edit rule' : 'New rule'} onClose={() => setEditing(null)}>
        {editing ? (
          <>
            <Banner message={sheetBanner} />
            <Input label="When the message has this word or phrase" value={editing.keyword} onChangeText={set('keyword')} autoCapitalize="none" error={local.keyword ?? fieldError(ruleError, 'keyword')} />
            <ChipSelect label="Match" options={MATCH_TYPES} value={editing.match_type} onChange={set('match_type')} />
            <ChipSelect label="Reply with" options={RESPONSE_TYPES} value={editing.response_type} onChange={set('response_type')} />
            {editing.response_type === 'text' ? (
              <Input label="Reply text" value={editing.response_text} onChangeText={set('response_text')} multiline style={{ minHeight: 90, textAlignVertical: 'top' }} error={local.response_text ?? fieldError(ruleError, 'response_text')} />
            ) : (
              <Input label="Template name" value={editing.template_name} onChangeText={set('template_name')} autoCapitalize="none" placeholder="order_update" error={local.template_name ?? fieldError(ruleError, 'template_name')} />
            )}
            <Input label="Priority (0 is checked first)" value={editing.priority} onChangeText={(v) => set('priority')(v.replace(/\D/g, ''))} keyboardType="number-pad" error={local.priority ?? fieldError(ruleError, 'priority')} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ flex: 1, fontWeight: '600' }}>Rule is on</Text>
              <Switch value={editing.is_active} onValueChange={set('is_active')} trackColor={{ true: colors.primary, false: colors.border }} />
            </View>
            <Button title="Save rule" loading={busy} onPress={saveRule} />
          </>
        ) : null}
      </Sheet>
    </>
  );
}
