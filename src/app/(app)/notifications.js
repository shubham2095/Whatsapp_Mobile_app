import { useCallback, useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listDevices } from '@/api/devices';
import { Badge, Banner, Button, Card, Screen, Text } from '@/components/ui';
import { getPushStatus, registerForPush } from '@/features/push/notifications';
import { formatListTime } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

const STATUS = {
  granted: { tone: 'success', label: 'On' },
  undetermined: { tone: 'warning', label: 'Not enabled yet' },
  denied: { tone: 'danger', label: 'Blocked in Settings' },
  unsupported: { tone: 'neutral', label: 'Unavailable here' },
};

export default function Notifications() {
  const { spacing } = useTheme();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const devices = useQuery({ queryKey: ['devices'], queryFn: listDevices });

  const refreshStatus = useCallback(() => getPushStatus().then(setStatus), []);
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    const res = await registerForPush();
    setBusy(false);
    setMessage(res.status === 'registered' ? { tone: 'success', text: 'This phone will now get new-message alerts.' } : { tone: 'danger', text: res.message });
    refreshStatus();
    devices.refetch();
  }

  const info = STATUS[status];
  const list = devices.data?.devices ?? [];

  return (
    <Screen scroll>
      <View style={{ gap: spacing.md }}>
        <Card style={{ gap: spacing.sm }}>
          <Text variant="subheading">New message alerts</Text>
          <Text muted variant="small">
            Get a notification on this phone when a customer messages your WhatsApp number. Tapping it opens the chat.
          </Text>
          {info ? <Badge tone={info.tone} label={info.label} /> : null}
        </Card>

        <Banner tone={message?.tone} message={message?.text} />

        {status === 'unsupported' ? (
          <Banner tone="info" message="Push alerts need the Heltog development or release build on a real phone. They do not work in Expo Go or an emulator." />
        ) : status === 'denied' ? (
          <Button title="Open phone settings" variant="outline" onPress={() => Linking.openSettings()} />
        ) : (
          <Button title={status === 'granted' ? 'Re-register this phone' : 'Enable notifications'} loading={busy} onPress={enable} />
        )}

        <Card style={{ gap: spacing.sm }}>
          <Text variant="small" muted>Phones registered to your account</Text>
          {devices.isLoading ? <Text muted>Loading...</Text> : null}
          {devices.isError ? <Text color="#e02424">{devices.error.message}</Text> : null}
          {!devices.isLoading && !devices.isError && list.length === 0 ? <Text muted>None yet.</Text> : null}
          {list.map((d) => (
            <View key={d.uuid} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>{d.platform} · {d.provider}</Text>
              <Text variant="small" muted>{d.last_used_at ? `used ${formatListTime(d.last_used_at)}` : ''}</Text>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}
