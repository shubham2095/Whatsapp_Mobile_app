import { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ActionSheet, Banner, Button, EmptyState, Input, Sheet, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { NumberCard } from '@/features/whatsapp/NumberCard';
import {
  useDisconnectNumber,
  useNumbers,
  useRegisterNumber,
  useSendTest,
  useSubscribeApp,
  useSyncNumber,
  useUpdateToken,
} from '@/features/whatsapp/hooks';
import { fieldError } from '@/lib/errors';
import { can } from '@/lib/permissions';
import { isDialable, normalizePhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';

// "Send test" uses the same sample template as the web app.
const TEST_TEMPLATE = { name: 'test_welcome', language: 'en' };

export default function WhatsappNumbers() {
  const user = useUser();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useNumbers();
  const canManage = can(user, 'whatsapp.manage');
  const canConnect = can(user, 'whatsapp.connect');

  const sync = useSyncNumber();
  const register = useRegisterNumber();
  const subscribe = useSubscribeApp();
  const updateToken = useUpdateToken();
  const disconnect = useDisconnectNumber();
  const sendTest = useSendTest();

  const [menuFor, setMenuFor] = useState(null); // number whose action sheet is open
  const [sheet, setSheet] = useState(null); // { kind: 'pin' | 'test' | 'token', number }
  const [value, setValue] = useState('');
  const [tpl, setTpl] = useState(TEST_TEMPLATE);
  const [sheetError, setSheetError] = useState(null);
  const [notice, setNotice] = useState(null);

  const numbers = data?.numbers ?? [];

  function openSheet(kind, number) {
    setSheet({ kind, number });
    setValue('');
    setSheetError(null);
    setNotice(null);
  }

  function run(mutation, vars, success) {
    setNotice(null);
    mutation.mutate(vars, {
      onSuccess: () => setNotice({ tone: 'success', text: success }),
      onError: (e) => setNotice({ tone: 'danger', text: e.message }),
    });
  }

  function submitSheet() {
    const { kind, number } = sheet;
    setSheetError(null);
    const done = { onSuccess: (text) => { setSheet(null); setNotice({ tone: 'success', text }); }, onError: (e) => setSheetError(e) };

    if (kind === 'pin') {
      if (value.length !== 6) return setSheetError({ message: 'Enter the 6-digit PIN.' });
      register.mutate({ id: number.id, pin: value }, { onSuccess: () => done.onSuccess('Number registered on the WhatsApp Cloud API.'), onError: done.onError });
    } else if (kind === 'token') {
      if (value.trim().length < 10) return setSheetError({ message: 'Paste the full access token.' });
      updateToken.mutate({ id: number.id, token: value.trim() }, { onSuccess: () => done.onSuccess('Access token updated. Try sending again.'), onError: done.onError });
    } else {
      const to = normalizePhone(value);
      if (!isDialable(to)) return setSheetError({ message: 'Enter a valid mobile number with country code.' });
      sendTest.mutate(
        { id: number.id, to, template: tpl.name.trim() || TEST_TEMPLATE.name, language: tpl.language.trim() || TEST_TEMPLATE.language },
        { onSuccess: (res) => done.onSuccess(`Test message sent to ${res.to}. Check WhatsApp on that phone.`), onError: done.onError },
      );
    }
    return undefined;
  }

  function confirmDisconnect(number) {
    Alert.alert('Disconnect number', `${number.display_phone_number} will stop sending and receiving in Heltog.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => run(disconnect, number.id, 'WhatsApp number disconnected.') },
    ]);
  }

  const menu = menuFor
    ? [
        ...(menuFor.is_registered ? [] : [{ label: 'Register number', icon: 'shield-checkmark-outline', onPress: () => openSheet('pin', menuFor) }]),
        { label: 'Sync from Meta', icon: 'sync-outline', onPress: () => run(sync, menuFor.id, 'Number details refreshed.') },
        { label: 'Send test message', icon: 'paper-plane-outline', onPress: () => openSheet('test', menuFor) },
        { label: 'Enable sending', icon: 'flash-outline', onPress: () => run(subscribe, menuFor.id, 'App subscribed to the WhatsApp Business Account. Try sending again.') },
        { label: 'Update access token', icon: 'key-outline', onPress: () => openSheet('token', menuFor) },
        { label: 'Disconnect', icon: 'unlink-outline', danger: true, onPress: () => confirmDisconnect(menuFor) },
      ]
    : [];

  const busy = register.isPending || updateToken.isPending || sendTest.isPending;
  const titles = { pin: 'Register number', token: 'Update access token', test: 'Send test message' };

  if (isLoading) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;

  return (
    <>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {isError ? <Banner message={error.message} /> : null}
        <Banner tone={notice?.tone} message={notice?.text} />

        {canConnect ? <Button title="Connect a number" onPress={() => router.push('/whatsapp-connect')} /> : null}

        {numbers.length === 0 && !isError ? (
          <EmptyState icon="logo-whatsapp" title="No numbers connected" message={canConnect ? 'Connect your WhatsApp Business number to start messaging.' : 'Ask an admin to connect a WhatsApp number.'} />
        ) : null}

        {numbers.map((n) => (
          <NumberCard key={n.id} number={n} onMenu={canManage ? setMenuFor : undefined} />
        ))}
      </ScrollView>

      <ActionSheet visible={!!menuFor} title={menuFor?.display_phone_number} actions={menu} onClose={() => setMenuFor(null)} />

      <Sheet visible={!!sheet} title={sheet ? titles[sheet.kind] : ''} onClose={() => setSheet(null)}>
        <Banner message={sheetError?.message} />
        {sheet?.kind === 'pin' ? (
          <>
            <Text variant="small" muted style={{ marginBottom: spacing.md }}>
              Choose a 6-digit PIN for two-step verification. This registers the number on the WhatsApp Cloud API so it can send messages.
            </Text>
            <Input label="6-digit PIN" value={value} onChangeText={(v) => setValue(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" password error={fieldError(sheetError, 'pin')} />
          </>
        ) : null}
        {sheet?.kind === 'token' ? (
          <>
            <Text variant="small" muted style={{ marginBottom: spacing.md }}>
              Paste a permanent System User token with whatsapp_business_messaging and whatsapp_business_management permissions, assigned to this WhatsApp Business Account (Meta Business Suite, Settings, System Users).
            </Text>
            <Input label="Access token" value={value} onChangeText={setValue} password autoCorrect={false} error={fieldError(sheetError, 'access_token')} />
          </>
        ) : null}
        {sheet?.kind === 'test' ? (
          <>
            <Text variant="small" muted style={{ marginBottom: spacing.md }}>
              Sends an approved template from {sheet.number.display_phone_number}, the only way to start a chat outside the 24-hour window.
            </Text>
            <Input label="Send to (mobile number)" value={value} onChangeText={setValue} keyboardType="phone-pad" placeholder="98765 43210" error={fieldError(sheetError, 'to')} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 2 }}>
                <Input label="Template" value={tpl.name} onChangeText={(v) => setTpl((t) => ({ ...t, name: v }))} autoCapitalize="none" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Language" value={tpl.language} onChangeText={(v) => setTpl((t) => ({ ...t, language: v }))} autoCapitalize="none" />
              </View>
            </View>
          </>
        ) : null}
        <Button title={sheet?.kind === 'test' ? 'Send test' : sheet?.kind === 'pin' ? 'Register' : 'Save token'} loading={busy} onPress={submitSheet} />
      </Sheet>
    </>
  );
}
