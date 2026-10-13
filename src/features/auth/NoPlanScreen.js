import { useState } from 'react';
import { Banner, Button, EmptyState, Screen } from '@/components/ui';
import { useAuth } from './AuthProvider';

// Shown to a tenant with no active subscription. Buying a plan (Razorpay) arrives in Phase 7.
export function NoPlanScreen() {
  const { reloadUser, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
        icon="card-outline"
        title="Choose a plan to get started"
        message="Your workspace needs an active plan. Pick one on the Heltog web app, then check again here."
      />
      <Banner message={error} />
      <Button title="I've activated a plan" loading={busy} onPress={check} />
      <Button title="Sign out" variant="ghost" onPress={logout} style={{ marginTop: 8 }} />
    </Screen>
  );
}
