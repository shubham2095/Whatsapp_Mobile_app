import { useState } from 'react';
import { Banner, Button, EmptyState, Screen } from '@/components/ui';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { can } from '@/lib/permissions';

// Shown while the workspace has no active plan (none bought yet, or it expired).
// Only billing, profile and notifications stay reachable, matching the web app.
export default function NoPlan() {
  const { user, reloadUser, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!user) return null;

  const expired = user.subscription?.status === 'expired';
  const canBuy = can(user, 'billing.manage');

  async function check() {
    setBusy(true);
    setError(null);
    try {
      await reloadUser();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <EmptyState
        icon={expired ? 'time-outline' : 'card-outline'}
        title={expired ? 'Your plan has ended' : 'Choose a plan to get started'}
        message={
          canBuy
            ? 'Pick a plan to unlock your WhatsApp inbox, contacts, campaigns and more.'
            : 'Your workspace needs an active plan. Ask the account owner to choose one, then check again here.'
        }
      />
      <Banner message={error} />
      {canBuy ? <Button title={expired ? 'Renew plan' : 'View plans'} onPress={() => router.push('/plans')} /> : null}
      <Button title="I have a plan now, refresh" variant={canBuy ? 'outline' : 'primary'} loading={busy} onPress={check} style={{ marginTop: 8 }} />
      {can(user, 'billing.view') ? <Button title="Billing and invoices" variant="ghost" onPress={() => router.push('/billing')} style={{ marginTop: 8 }} /> : null}
      <Button title="Contact support" variant="ghost" onPress={() => router.push('/support')} style={{ marginTop: 8 }} />
      <Button title="Sign out" variant="ghost" onPress={logout} style={{ marginTop: 8 }} />
    </Screen>
  );
}
