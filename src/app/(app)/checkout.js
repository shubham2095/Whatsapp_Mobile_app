import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, Input, Screen, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { loadBillingDetails, saveBillingDetails } from '@/features/billing/billingDetails';
import { useCreateOrder, usePlans, useVerifyPayment } from '@/features/billing/hooks';
import { formatMinor, periodLabel, priceBreakdown } from '@/features/billing/planMeta';
import { RazorpayCheckout } from '@/features/billing/RazorpayCheckout';
import { fieldError, isValidEmail } from '@/lib/errors';
import { useTheme } from '@/theme/ThemeProvider';

function Row({ label, value, strong }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text muted={!strong} style={strong ? { fontWeight: '700' } : undefined}>{label}</Text>
      <Text style={strong ? { fontWeight: '700' } : undefined}>{value}</Text>
    </View>
  );
}

export default function Checkout() {
  const { planId } = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, spacing } = useTheme();
  const plans = usePlans();
  const [saved, setSaved] = useState(undefined); // undefined = still reading

  useEffect(() => {
    loadBillingDetails().then(setSaved);
  }, []);

  const plan = plans.data?.plans.find((p) => p.id === planId);

  if (plans.isLoading || saved === undefined) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (plans.isError || !plan) {
    return (
      <Screen>
        <Banner message={plans.isError ? plans.error.message : 'That plan is no longer available.'} />
        <Button title="Back to plans" variant="outline" onPress={() => router.back()} />
      </Screen>
    );
  }

  const initial = saved ?? {
    name: user.tenant?.company_name ?? user.tenant?.name ?? user.name,
    email: user.email,
    phone: user.phone ?? '',
    address: '',
    gstin: '',
  };
  return <CheckoutFlow plan={plan} gstRate={plans.data.gst_rate ?? 18} initial={initial} />;
}

// stage: form -> paying -> verifying -> done   (verifying may end in verify_failed, which can be retried)
function CheckoutFlow({ plan, gstRate, initial }) {
  const { reloadUser } = useAuth();
  const { colors, spacing } = useTheme();
  const createOrder = useCreateOrder();
  const verify = useVerifyPayment();

  const [form, setForm] = useState({ ...initial, gstin: initial.gstin ?? '' });
  const [stage, setStage] = useState('form');
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [result, setResult] = useState(null); // { invoiceNumber, message }
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const err = (key) => local[key] ?? fieldError(error, `billing.${key}`);
  const price = priceBreakdown(plan, gstRate);
  const free = price.total <= 0;
  const billing = () => ({
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    gstin: form.gstin.trim().toUpperCase() || undefined,
  });

  // Android back: leaving the payment sheet is a cancel; never leave mid-verification.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stage === 'verifying') return true;
      if (stage === 'paying') {
        setStage('form');
        setError({ message: 'Payment cancelled. You have not been charged.' });
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stage]);

  async function finish(message, invoice) {
    await saveBillingDetails(billing());
    try {
      await reloadUser(); // new plan, features and limits
    } catch {}
    setResult({ message, invoiceNumber: invoice?.number });
    setStage('done');
  }

  async function startPayment() {
    const p = {};
    if (!form.name.trim()) p.name = 'Enter the name for the invoice.';
    if (!isValidEmail(form.email)) p.email = 'Enter a valid email address.';
    if (form.phone.replace(/\D/g, '').length < 10) p.phone = 'Enter a valid mobile number.';
    if (form.address.trim().length < 5) p.address = 'Enter the billing address.';
    if (form.gstin.trim() && form.gstin.trim().length !== 15) p.gstin = 'A GSTIN has 15 characters.';
    setLocal(p);
    setError(null);
    if (Object.keys(p).length) return;

    try {
      const res = await createOrder.mutateAsync({ planId: plan.id, billing: billing() });
      if (res.free) {
        await finish('Your plan is active.', res.invoice);
        return;
      }
      setOrder(res);
      setStage('paying');
    } catch (e) {
      setError(e);
    }
  }

  async function confirmPayment(resp) {
    setPayment(resp);
    setStage('verifying');
    setError(null);
    try {
      const res = await verify.mutateAsync({ planId: plan.id, billing: billing(), ...resp });
      await finish(res.message, res.invoice);
    } catch (e) {
      setError(e);
      setStage('verify_failed');
    }
  }

  const headerLocked = stage === 'verifying' || stage === 'done';
  const screenOptions = { title: stage === 'paying' ? 'Secure payment' : 'Checkout', headerBackVisible: !headerLocked, gestureEnabled: !headerLocked };

  if (stage === 'paying' && order) {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={screenOptions} />
        <RazorpayCheckout
          order={order}
          planName={plan.name}
          billing={billing()}
          onSuccess={confirmPayment}
          onFailed={(message) => {
            setStage('form');
            setError({ message });
          }}
          onDismiss={() => {
            setStage('form');
            setError({ message: 'Payment cancelled. You have not been charged.' });
          }}
        />
      </View>
    );
  }

  if (stage === 'verifying') {
    return (
      <Screen>
        <Stack.Screen options={screenOptions} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="subheading">Confirming your payment</Text>
          <Text muted style={{ textAlign: 'center' }}>Please keep the app open. This takes a few seconds.</Text>
        </View>
      </Screen>
    );
  }

  if (stage === 'done') {
    return (
      <Screen>
        <Stack.Screen options={screenOptions} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg }}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text variant="heading">{plan.name} plan is active</Text>
          <Text muted style={{ textAlign: 'center' }}>{result?.message}</Text>
          {result?.invoiceNumber ? <Text variant="small" muted>Invoice {result.invoiceNumber}</Text> : null}
        </View>
        <Button title="Go to dashboard" onPress={() => router.replace('/')} />
        <Button title="View invoices" variant="ghost" onPress={() => router.replace('/invoices')} style={{ marginTop: 8 }} />
      </Screen>
    );
  }

  if (stage === 'verify_failed') {
    return (
      <Screen scroll>
        <Stack.Screen options={screenOptions} />
        <Banner message={error?.message} />
        <Text muted style={{ marginBottom: spacing.lg }}>
          Your payment went through at Razorpay, but we could not confirm it yet. Try again. If it keeps failing, contact support with payment ID {payment?.razorpay_payment_id}. Do not pay twice.
        </Text>
        <Button title="Retry confirmation" onPress={() => confirmPayment(payment)} />
        <Button title="Back to billing" variant="ghost" onPress={() => router.replace('/billing')} style={{ marginTop: 8 }} />
      </Screen>
    );
  }

  const known = ['name', 'email', 'phone', 'address', 'gstin'].map((k) => `billing.${k}`);
  const bannerMessage = error && !known.some((k) => fieldError(error, k)) ? error.message : null;

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={screenOptions} />
      <Card style={{ marginBottom: spacing.lg }}>
        <Text variant="subheading">{plan.name}</Text>
        <Text variant="small" muted style={{ marginBottom: spacing.sm }}>{free ? 'Free plan' : `Billed per ${periodLabel(plan)}`}</Text>
        <Row label="Plan price" value={formatMinor(price.base, plan.currency)} />
        {free ? null : <Row label={`GST (${price.rate}%)`} value={formatMinor(price.tax, plan.currency)} />}
        <Row label="Total" value={formatMinor(price.total, plan.currency)} strong />
      </Card>

      <Banner message={bannerMessage} />
      <Text variant="small" muted style={{ marginBottom: spacing.sm, fontWeight: '600' }}>Invoice details</Text>
      <Input label="Name / company" value={form.name} onChangeText={set('name')} autoCapitalize="words" error={err('name')} />
      <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={err('email')} />
      <Input label="Mobile number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={err('phone')} />
      <Input label="Billing address" value={form.address} onChangeText={set('address')} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} error={err('address')} />
      <Input label="GSTIN (optional)" value={form.gstin} onChangeText={set('gstin')} autoCapitalize="characters" maxLength={15} error={err('gstin')} />

      <Button title={free ? 'Activate free plan' : `Pay ${formatMinor(price.total, plan.currency)}`} loading={createOrder.isPending} onPress={startPayment} />
      {free ? null : <Text variant="caption" muted style={{ textAlign: 'center', marginTop: spacing.sm }}>Secure payment by Razorpay (UPI, cards, netbanking, wallets).</Text>}
    </Screen>
  );
}
