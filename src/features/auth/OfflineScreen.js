import { Button, EmptyState, Screen } from '@/components/ui';
import { useAuth } from './AuthProvider';

// Shown when a stored session exists but the server could not be reached on launch.
export function OfflineScreen() {
  const { retry, logout } = useAuth();
  return (
    <Screen>
      <EmptyState icon="cloud-offline-outline" title="Can't reach Heltog" message="Check your internet connection and try again." />
      <Button title="Try again" onPress={retry} />
      <Button title="Sign out" variant="ghost" onPress={logout} style={{ marginTop: 8 }} />
    </Screen>
  );
}
