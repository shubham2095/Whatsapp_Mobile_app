import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Banner, Button, Card, ChipSelect, Input, Screen, Sheet, Text } from '@/components/ui';
import {
  useAssignPlan,
  useCompanies,
  useCompanyUsers,
  useDeleteCompany,
  useResetUserPassword,
  useToggleCompany,
} from '@/features/admin/hooks';
import { COMPANY_TONE } from '@/features/admin/meta';
import { formatListTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

function Info({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 5 }}>
      <Text variant="small" muted>{label}</Text>
      <Text variant="small" style={{ flexShrink: 1, textAlign: 'right' }} selectable>{value}</Text>
    </View>
  );
}

// There is no single-company endpoint, so this reads the company out of the list.
export default function CompanyDetail() {
  const { id } = useLocalSearchParams();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch } = useCompanies();
  const toggle = useToggleCompany();
  const assign = useAssignPlan();
  const remove = useDeleteCompany();
  const reset = useResetUserPassword();

  const [usersOpen, setUsersOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [password, setPassword] = useState('');
  const [typed, setTyped] = useState('');
  const [notice, setNotice] = useState(null);
  const [sheetError, setSheetError] = useState(null);

  const company = data?.companies.find((c) => c.id === id);
  const users = useCompanyUsers(id, usersOpen);

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) {
    return (
      <Screen>
        <Banner message={error.message} />
        <Button title="Try again" variant="outline" onPress={() => refetch()} />
      </Screen>
    );
  }
  if (!company) return <Screen><Banner message="Company not found. It may have been deleted." /></Screen>;

  const suspended = company.status === 'suspended';
  const fail = (title) => (e) => Alert.alert(title, e.message);

  function confirmToggle() {
    Alert.alert(
      suspended ? 'Reactivate company' : 'Suspend company',
      suspended ? `${company.name} will be able to sign in again.` : `${company.name} and all its users lose access until you reactivate it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: suspended ? 'Reactivate' : 'Suspend', style: suspended ? 'default' : 'destructive', onPress: () => toggle.mutate(company.id, { onSuccess: (r) => setNotice(r.message), onError: fail('Could not update') }) },
      ],
    );
  }

  function pickPlan(plan) {
    assign.mutate(
      { id: company.id, planId: plan.value },
      { onSuccess: () => { setPlanOpen(false); setNotice(`${plan.label} plan assigned.`); }, onError: (e) => setSheetError(e.message) },
    );
  }

  function submitReset() {
    setSheetError(null);
    if (password.length < 8) return setSheetError('Use at least 8 characters.');
    reset.mutate(
      { companyId: company.id, userId: resetFor.id, password },
      { onSuccess: (r) => { setResetFor(null); setPassword(''); setNotice(r.message); }, onError: (e) => setSheetError(e.message) },
    );
    return undefined;
  }

  function submitDelete() {
    remove.mutate(company.id, { onSuccess: () => { setDeleteOpen(false); router.back(); }, onError: (e) => setSheetError(e.message) });
  }

  const planOptions = (data.plans ?? []).map((p) => ({ value: p.id, label: p.name }));

  return (
    <>
      <Screen scroll edges={['bottom']}>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="heading" style={{ flex: 1 }}>{company.name}</Text>
            <Badge tone={COMPANY_TONE[company.status] ?? 'muted'} label={company.status} />
          </View>
          <Banner tone="success" message={notice} />

          <Card>
            <Info label="Owner" value={company.owner_name} />
            <Info label="Owner email" value={company.owner_email} />
            <Info label="Plan" value={company.plan_name ?? 'No plan'} />
            <Info label="Users" value={company.users_count} />
            <Info label="Agents" value={`${company.agents_used ?? 0} of ${company.agents_limit ?? 'unlimited'}`} />
            <Info label="Trial ends" value={company.trial_ends_at ? new Date(company.trial_ends_at).toLocaleDateString() : null} />
            <Info label="Joined" value={company.created_at ? formatListTime(company.created_at) : null} />
          </Card>

          <Button title={company.plan_name ? 'Change plan' : 'Assign a plan'} onPress={() => { setSheetError(null); setPlanOpen(true); }} />
          <Button title="View users" variant="outline" onPress={() => { setSheetError(null); setUsersOpen(true); }} />
          <Button title={suspended ? 'Reactivate company' : 'Suspend company'} variant="outline" loading={toggle.isPending} onPress={confirmToggle} />
          <Button title="Delete company" variant="danger" onPress={() => { setTyped(''); setSheetError(null); setDeleteOpen(true); }} />
        </View>
      </Screen>

      <Sheet visible={planOpen} title="Assign plan" onClose={() => setPlanOpen(false)}>
        <Banner message={sheetError} />
        <Text variant="small" muted style={{ marginBottom: spacing.md }}>The subscription of this company becomes active on this plan for one billing period, starting now.</Text>
        {planOptions.length === 0 ? <Text muted>No active plans. Create one in the Plans tab.</Text> : null}
        <ChipSelect options={planOptions} value={company.plan_id} onChange={(v) => pickPlan(planOptions.find((o) => o.value === v))} />
        {assign.isPending ? <ActivityIndicator color={colors.primary} /> : null}
      </Sheet>

      <Sheet visible={usersOpen} title={`Users of ${company.name}`} onClose={() => setUsersOpen(false)}>
        {users.isLoading ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} /> : null}
        {users.isError ? <Banner message={users.error.message} /> : null}
        {users.data?.users.map((u) => (
          <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }} numberOfLines={1}>{u.name}</Text>
              <Text variant="caption" muted numberOfLines={1}>{u.email}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                <Badge tone={u.role === 'Admin' ? 'accent' : 'neutral'} label={u.role} />
                <Badge tone={u.status === 'active' ? 'success' : 'warning'} label={u.status} />
              </View>
            </View>
            <Pressable onPress={() => { setSheetError(null); setPassword(''); setResetFor(u); setUsersOpen(false); }} accessibilityRole="button" hitSlop={8}>
              <Text color={colors.primary} style={{ fontWeight: '600' }}>Reset password</Text>
            </Pressable>
          </View>
        ))}
      </Sheet>

      <Sheet visible={!!resetFor} title={`New password for ${resetFor?.name ?? ''}`} onClose={() => setResetFor(null)}>
        <Banner message={sheetError} />
        <Text variant="small" muted style={{ marginBottom: spacing.md }}>Share the new password with the user yourself. They can change it after signing in.</Text>
        <Input label="New password" password value={password} onChangeText={setPassword} autoComplete="new-password" />
        <Button title="Set password" loading={reset.isPending} onPress={submitReset} />
      </Sheet>

      <Sheet visible={deleteOpen} title="Delete company" onClose={() => setDeleteOpen(false)}>
        <Banner message={sheetError} />
        <Banner tone="warning" message="This removes the company and its data for good. To only stop access, suspend it instead." />
        <Text variant="small" muted style={{ marginBottom: spacing.sm }}>Type the company name to confirm: <Text variant="small" style={{ fontWeight: '700' }}>{company.name}</Text></Text>
        <Input value={typed} onChangeText={setTyped} autoCapitalize="none" autoCorrect={false} placeholder={company.name} />
        <Button title="Delete permanently" variant="danger" disabled={typed.trim() !== company.name} loading={remove.isPending} onPress={submitDelete} />
      </Sheet>
    </>
  );
}
