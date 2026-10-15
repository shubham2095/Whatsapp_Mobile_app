import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, EmptyState, Input, Text, ListSkeleton } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useAddToBlacklist, useBlacklist, useRemoveFromBlacklist } from '@/features/contacts/hooks';
import { fieldError } from '@/lib/errors';
import { formatListTime } from '@/lib/format';
import { can } from '@/lib/permissions';
import { displayPhone, isDialable, normalizePhone } from '@/lib/phone';
import { fontRegular } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';

// Numbers here are skipped by every campaign and bulk send. Add/remove needs contacts.delete (as on the web).
export default function Blacklist() {
  const user = useUser();
  const { colors, radius, spacing, fontSize } = useTheme();
  const canEdit = can(user, 'contacts.delete');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ phone: '', name: '', reason: '' });
  const [error, setError] = useState(null);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isError, error: loadError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useBlacklist({ search });
  const add = useAddToBlacklist();
  const remove = useRemoveFromBlacklist();
  const entries = useMemo(() => data?.pages.flatMap((p) => p.entries) ?? [], [data]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  function submit() {
    const phone = normalizePhone(form.phone);
    setError(null);
    if (!isDialable(phone)) {
      setLocalError('Enter a valid mobile number with country code.');
      return;
    }
    setLocalError(null);
    add.mutate(
      { phone, name: form.name.trim() || undefined, reason: form.reason.trim() || undefined },
      {
        onSuccess: () => {
          setForm({ phone: '', name: '', reason: '' });
          setAdding(false);
        },
        onError: setError,
      },
    );
  }

  function confirmRemove(entry) {
    Alert.alert('Remove from black list', `${displayPhone(entry.phone)} can receive messages again.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(entry.id, { onError: (e) => Alert.alert('Could not remove', e.message) }) },
    ]);
  }

  const header = (
    <View style={{ padding: spacing.md, gap: spacing.sm, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md }}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Search number or name"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          style={{ flex: 1, color: colors.text, fontFamily: fontRegular, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
        />
      </View>
      {canEdit ? <Button title={adding ? 'Cancel' : 'Block a number'} variant={adding ? 'ghost' : 'outline'} onPress={() => setAdding((a) => !a)} /> : null}
    </View>
  );

  const form_ = adding ? (
    <Card style={{ margin: spacing.md }}>
      <Banner message={error?.message && !fieldError(error, 'phone') ? error.message : null} />
      <Input label="Phone number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="98765 43210 or +1 555 123 4567" error={localError ?? fieldError(error, 'phone')} />
      <Input label="Name (optional)" value={form.name} onChangeText={set('name')} autoCapitalize="words" />
      <Input label="Reason (optional)" value={form.reason} onChangeText={set('reason')} placeholder="e.g. Requested opt-out" />
      <Button title="Add to black list" loading={add.isPending} onPress={submit} />
    </Card>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {isError && !data ? (
        <View style={{ padding: spacing.lg }}>
          <Banner message={loadError.message} />
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={isLoading ? [] : entries}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={<>{header}{form_}</>}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name="ban" size={22} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600' }}>{item.name || displayPhone(item.phone)}</Text>
                {item.name ? <Text variant="small" muted>{displayPhone(item.phone)}</Text> : null}
                {item.reason ? <Text variant="small">{item.reason}</Text> : null}
                <Text variant="caption" muted>Added {formatListTime(item.created_at)}</Text>
              </View>
              {canEdit ? (
                <Pressable onPress={() => confirmRemove(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove from black list">
                  <Ionicons name="trash-outline" size={22} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <ListSkeleton />
            ) : (
              <EmptyState icon="shield-checkmark-outline" title={search ? 'No matching numbers' : 'Black list is empty'} message="Blocked numbers are skipped by every campaign and bulk send." />
            )
          }
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
        />
      )}
    </View>
  );
}
