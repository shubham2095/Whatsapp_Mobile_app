import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, TextInput, View } from 'react-native';
import * as Contacts from 'expo-contacts/legacy';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, EmptyState, Text } from '@/components/ui';
import { DEFAULT_COUNTRY_CODE } from '@/config';
import { displayPhone, isDialable, normalizePhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';
import { CountryCodeField } from './CountryCodeField';
import { ImportResult } from './ImportResult';
import { runImport } from './runImport';

// Reads every phone number from the device contacts (one entry per number).
async function loadDeviceContacts() {
  const entries = [];
  let pageOffset = 0;
  for (;;) {
    const res = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Company],
      pageSize: 500,
      pageOffset,
      sort: Contacts.SortTypes.FirstName,
    });
    for (const c of res.data) {
      (c.phoneNumbers ?? []).forEach((p, i) => {
        if (!p.number) return;
        entries.push({
          key: `${c.id}:${i}`,
          name: c.name || '',
          raw: p.number,
          email: c.emails?.[0]?.email,
          company: c.company,
        });
      });
    }
    if (!res.hasNextPage) break;
    pageOffset += res.data.length;
  }
  return entries;
}

export function PhoneImport() {
  const { colors, radius, spacing, fontSize } = useTheme();
  const [state, setState] = useState('loading'); // loading | denied | ready | error
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [code, setCode] = useState(DEFAULT_COUNTRY_CODE);
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const perm = await Contacts.requestPermissionsAsync();
      if (!perm.granted) {
        setState('denied');
        return;
      }
      const list = await loadDeviceContacts();
      setEntries(list);
      setSelected(new Set(list.map((e) => e.key)));
      setState('ready');
    } catch (e) {
      setError(e.message || 'Could not read your contacts.');
      setState('error');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q) || e.raw.replace(/\D/g, '').includes(q.replace(/\D/g, '') || q));
  }, [entries, query]);

  const toggle = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allVisibleSelected = visible.length > 0 && visible.every((e) => selected.has(e.key));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const e of visible) {
        if (allVisibleSelected) next.delete(e.key);
        else next.add(e.key);
      }
      return next;
    });

  async function submit() {
    setError(null);
    const rows = entries.filter((e) => selected.has(e.key)).map((e) => ({ phone: e.raw, name: e.name || undefined, email: e.email, company: e.company }));
    setProgress({ done: 0, total: rows.length });
    try {
      const totals = await runImport(rows, { defaultCode: code || DEFAULT_COUNTRY_CODE, onProgress: (done, total) => setProgress({ done, total }) });
      setResult(totals);
    } catch (e) {
      setError(e.message);
    } finally {
      setProgress(null);
    }
  }

  if (result) return <ImportResult result={result} />;
  if (state === 'loading') return <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />;
  if (state === 'denied') {
    return (
      <View style={{ flex: 1 }}>
        <EmptyState icon="lock-closed-outline" title="Contacts access is off" message="Allow Heltog to read your contacts in Settings to import them." />
        <Button title="Open phone settings" variant="outline" onPress={() => Linking.openSettings()} />
        <Button title="Try again" variant="ghost" onPress={load} style={{ marginTop: 8 }} />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View>
        <Banner message={error} />
        <Button title="Try again" variant="outline" onPress={load} />
      </View>
    );
  }

  const importable = entries.filter((e) => selected.has(e.key)).length;

  return (
    <View style={{ flex: 1 }}>
      <CountryCodeField value={code} onChange={setCode} />
      <Banner message={error} />
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your contacts"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          style={{ flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
        />
      </View>
      <Pressable onPress={toggleAll} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
        <Ionicons name={allVisibleSelected ? 'checkbox' : 'square-outline'} size={22} color={colors.primary} />
        <Text style={{ fontWeight: '600' }}>{allVisibleSelected ? 'Deselect all' : 'Select all'} ({visible.length})</Text>
      </Pressable>

      <FlatList
        data={visible}
        keyExtractor={(e) => e.key}
        extraData={selected}
        style={{ flex: 1 }}
        initialNumToRender={20}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<EmptyState icon="people-outline" title="No contacts with phone numbers" />}
        renderItem={({ item }) => {
          const on = selected.has(item.key);
          const phone = normalizePhone(item.raw, code || DEFAULT_COUNTRY_CODE);
          const ok = isDialable(phone);
          return (
            <Pressable onPress={() => toggle(item.key)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontWeight: '600' }}>{item.name || displayPhone(phone) || item.raw}</Text>
                <Text variant="small" color={ok ? colors.muted : colors.danger}>{ok ? displayPhone(phone) : `${item.raw} (invalid)`}</Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Button
        title={progress ? `Importing ${progress.done}/${progress.total}` : `Import ${importable} ${importable === 1 ? 'contact' : 'contacts'}`}
        disabled={importable === 0}
        loading={!!progress}
        onPress={submit}
        style={{ marginTop: spacing.sm }}
      />
    </View>
  );
}
