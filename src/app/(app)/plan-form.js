import { useState } from 'react';
import { ActivityIndicator, Switch, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Banner, Button, CheckList, ChipSelect, Input, Screen, Text } from '@/components/ui';
import { useAdminPlans, useCreatePlan, useUpdatePlan } from '@/features/admin/hooks';
import { FEATURE_LABELS } from '@/features/billing/planMeta';
import { fieldError } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

const LIMIT_TITLES = {
  max_agents: 'Max agents',
  max_contacts: 'Max contacts',
  max_campaigns: 'Max campaigns',
  max_chatbots: 'Max chatbots',
  max_templates: 'Max templates',
};
const PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];
const pretty = (k) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// Super admin: create a plan (no `id`) or edit one (`id`).
export default function PlanForm() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const plans = useAdminPlans();

  if (plans.isLoading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;
  if (plans.isError) return <Screen><Banner message={plans.error.message} /></Screen>;

  const plan = typeof id === 'string' ? plans.data.plans.find((p) => p.id === id) : undefined;
  if (typeof id === 'string' && !plan) return <Screen><Banner message="Plan not found." /></Screen>;
  return <Form plan={plan} limitKeys={plans.data.limit_keys} featureKeys={plans.data.feature_keys} />;
}

function Form({ plan, limitKeys, featureKeys }) {
  const editing = !!plan;
  const { colors, spacing } = useTheme();
  const create = useCreatePlan();
  const update = useUpdatePlan();

  // Plans can carry extra keys that were added by hand earlier; keep and show them so saving never drops them.
  const allLimits = [...new Set([...limitKeys, ...Object.keys(plan?.limits ?? {})])];
  const allFeatures = [...new Set([...featureKeys, ...Object.keys(plan?.features ?? {})])];

  const [form, setForm] = useState({
    name: plan?.name ?? '',
    price: plan ? String(plan.price) : '0',
    billing_period: plan?.billing_period ?? 'monthly',
    description: plan?.description ?? '',
    is_active: plan?.is_active ?? true,
    is_public: plan?.is_public ?? true,
  });
  // -1 (or missing) means unlimited, shown as an empty box.
  const [limits, setLimits] = useState(() => Object.fromEntries(allLimits.map((k) => [k, plan && plan.limits?.[k] >= 0 ? String(plan.limits[k]) : ''])));
  const [features, setFeatures] = useState(allFeatures.filter((k) => plan?.features?.[k]));
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, key);
  const busy = create.isPending || update.isPending;

  function submit() {
    const p = {};
    if (!form.name.trim()) p.name = 'Give the plan a name.';
    if (form.price && !/^\d+(\.\d{1,2})?$/.test(form.price)) p.price = 'Enter the price in rupees, like 999 or 1499.50.';
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      billing_period: form.billing_period,
      price: Number(form.price || 0),
      currency: plan?.currency ?? 'INR',
      limits: Object.fromEntries(allLimits.map((k) => [k, limits[k] === '' ? '' : Number(limits[k])])),
      features: Object.fromEntries(allFeatures.map((k) => [k, features.includes(k)])),
      is_active: form.is_active,
      is_public: form.is_public,
    };
    const done = { onSuccess: () => router.back(), onError: setError };
    if (editing) update.mutate({ id: plan.id, ...body }, done);
    else create.mutate(body, done);
  }

  const known = ['name', 'price', 'billing_period', 'description'];
  const bannerMessage = error && !known.some((k) => fieldError(error, k)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: editing ? 'Edit plan' : 'New plan' }} />
      <Banner message={bannerMessage} />
      {editing && plan.subscribers > 0 ? (
        <Banner tone="info" message={`${plan.subscribers} ${plan.subscribers === 1 ? 'company is' : 'companies are'} on this plan. Changes to limits and features apply to them right away.`} />
      ) : null}

      <Input label="Plan name" value={form.name} onChangeText={set('name')} autoCapitalize="words" error={err('name')} />
      <Input label="Price (₹, before GST)" value={form.price} onChangeText={(v) => set('price')(v.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" error={err('price')} />
      <ChipSelect label="Billing" options={PERIODS} value={form.billing_period} onChange={set('billing_period')} />
      <Input label="Description (optional)" value={form.description} onChangeText={set('description')} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} error={err('description')} />

      <Text variant="small" muted style={{ marginBottom: spacing.xs, fontWeight: '600' }}>Limits (leave empty for unlimited, 0 blocks the feature)</Text>
      {allLimits.map((k) => (
        <Input
          key={k}
          label={LIMIT_TITLES[k] ?? pretty(k)}
          value={limits[k]}
          onChangeText={(v) => setLimits((s) => ({ ...s, [k]: v.replace(/\D/g, '') }))}
          keyboardType="number-pad"
          placeholder="Unlimited"
        />
      ))}

      <CheckList label="Features" items={allFeatures.map((k) => ({ key: k, label: FEATURE_LABELS[k] ?? pretty(k) }))} value={features} onChange={setFeatures} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600' }}>Active</Text>
          <Text variant="caption" muted>Inactive plans cannot be bought or assigned.</Text>
        </View>
        <Switch value={form.is_active} onValueChange={set('is_active')} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600' }}>Public</Text>
          <Text variant="caption" muted>Shown to companies on the Plans screen.</Text>
        </View>
        <Switch value={form.is_public} onValueChange={set('is_public')} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>

      <Button title={editing ? 'Save plan' : 'Create plan'} loading={busy} onPress={submit} />
    </Screen>
  );
}
