import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Text, Card, Badge, Button } from '@/components/ui';
import { health } from '@/api/system';
import { API_URL } from '@/config';
import { useTheme } from '@/theme/ThemeProvider';

// Phase 0 placeholder: proves the theme, UI kit, React Query and API client work.
// Phase 1 replaces this with the auth gate (login / tabs).
export default function Home() {
  const { spacing } = useTheme();
  const { data, error, isFetching, refetch } = useQuery({ queryKey: ['health'], queryFn: health });

  return (
    <Screen scroll>
      <View style={{ gap: spacing.md }}>
        <Text variant="title">Heltog</Text>
        <Text muted>SocialFlow mobile - Phase 0 foundation</Text>
        <Card style={{ gap: spacing.sm }}>
          <Text variant="small" muted>API</Text>
          <Text selectable>{API_URL}</Text>
          {error ? (
            <Badge tone="danger" label={error.message} />
          ) : data ? (
            <Badge tone="success" label={`Backend ${data.status}`} />
          ) : (
            <Badge label="Checking..." />
          )}
        </Card>
        <Button title="Re-check backend" loading={isFetching} onPress={() => refetch()} />
      </View>
    </Screen>
  );
}
