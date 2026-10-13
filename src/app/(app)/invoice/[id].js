import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Badge, Banner, Button, Card, Screen, Text } from '@/components/ui';
import { useInvoices } from '@/features/billing/hooks';
import { formatMinor } from '@/features/billing/planMeta';
import { useTheme } from '@/theme/ThemeProvider';

function Row({ label, value, strong }) {
  if (!value && value !== 0) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 }}>
      <Text variant="small" muted={!strong} style={strong ? { fontWeight: '700' } : undefined}>{label}</Text>
      <Text variant="small" style={[{ flexShrink: 1, textAlign: 'right' }, strong ? { fontWeight: '700' } : null]} selectable>{value}</Text>
    </View>
  );
}

// There is no single-invoice endpoint, so the invoice is looked up in the (paged) list.
export default function InvoiceDetail() {
  const { id } = useLocalSearchParams();
  const { colors, spacing } = useTheme();
  const { data, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useInvoices();
  const invoice = useMemo(() => data?.pages.flatMap((p) => p.invoices).find((i) => i.id === id), [data, id]);

  useEffect(() => {
    if (!invoice && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [invoice, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading || (!invoice && hasNextPage)) return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (isError) return <Screen><Banner message={error.message} /></Screen>;
  if (!invoice) return <Screen><Banner message="Invoice not found." /></Screen>;

  const meta = invoice.meta ?? {};
  const seller = meta.seller ?? {};
  const customer = meta.customer ?? {};
  const period = meta.period_start && meta.period_end ? `${meta.period_start} to ${meta.period_end}` : null;

  async function share() {
    const lines = [
      `Invoice ${invoice.number}`,
      seller.name ? `From: ${seller.name}` : null,
      customer.name ? `To: ${customer.name}` : null,
      ...(invoice.line_items ?? []).map((l) => `${l.description}: ${formatMinor(l.amount_minor, invoice.currency)}`),
      `Subtotal: ${invoice.subtotal}`,
      `GST${meta.gst_rate ? ` (${meta.gst_rate}%)` : ''}: ${invoice.tax}`,
      `Total: ${invoice.total}`,
      `Status: ${invoice.status}`,
    ].filter(Boolean);
    await Share.share({ message: lines.join('\n') });
  }

  return (
    <Screen scroll edges={['bottom']}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="heading" style={{ flex: 1 }}>{invoice.number}</Text>
          <Badge tone={invoice.status === 'paid' ? 'success' : 'warning'} label={invoice.status} />
        </View>

        <Card>
          <Row label="Issued" value={invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : null} />
          <Row label="Paid" value={invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : null} />
          <Row label="Period" value={period} />
          <Row label="Plan" value={meta.plan_name} />
        </Card>

        <Card>
          {(invoice.line_items ?? []).map((l, i) => (
            <Row key={i} label={l.description} value={formatMinor(l.amount_minor, invoice.currency)} />
          ))}
          <Row label="Subtotal" value={invoice.subtotal} />
          <Row label={`GST${meta.gst_rate ? ` (${meta.gst_rate}%)` : ''}`} value={invoice.tax} />
          <Row label="Total" value={invoice.total} strong />
        </Card>

        {seller.name || seller.address ? (
          <Card style={{ gap: 2 }}>
            <Text variant="small" muted>Billed by</Text>
            {seller.name ? <Text style={{ fontWeight: '600' }}>{seller.name}</Text> : null}
            {seller.address ? <Text variant="small">{seller.address}</Text> : null}
            {seller.gstin ? <Text variant="small" muted>GSTIN {seller.gstin}</Text> : null}
          </Card>
        ) : null}

        <Card style={{ gap: 2 }}>
          <Text variant="small" muted>Billed to</Text>
          {customer.name ? <Text style={{ fontWeight: '600' }}>{customer.name}</Text> : null}
          {customer.address ? <Text variant="small">{customer.address}</Text> : null}
          {customer.email ? <Text variant="small" muted>{customer.email}</Text> : null}
          {customer.phone ? <Text variant="small" muted>{customer.phone}</Text> : null}
          {customer.gstin ? <Text variant="small" muted>GSTIN {customer.gstin}</Text> : null}
        </Card>

        <Button title="Share invoice summary" variant="outline" onPress={share} />
      </View>
    </Screen>
  );
}
