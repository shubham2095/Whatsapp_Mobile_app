import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Banner, Button, Card, Text } from '@/components/ui';

export function ImportResult({ result }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  }, [queryClient]);

  return (
    <Card style={{ gap: 8 }}>
      <Banner tone="success" message="Import finished." />
      <Text>New contacts: <Text style={{ fontWeight: '700' }}>{result.created}</Text></Text>
      <Text>Updated: <Text style={{ fontWeight: '700' }}>{result.updated}</Text></Text>
      <Text>Skipped (invalid or duplicate): <Text style={{ fontWeight: '700' }}>{result.skipped}</Text></Text>
      <Button title="Done" onPress={() => router.back()} style={{ marginTop: 8 }} />
    </Card>
  );
}
