import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ActionSheet, Banner, Button, EmptyState, Fab, FadeInItem, Input, ListSkeleton, Sheet, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useToast } from '@/components/Toast';
import { useUser } from '@/features/auth/AuthProvider';
import { can } from '@/lib/permissions';
import { fontRegular } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { bulkActions } from './bulkActions';
import { ContactRow } from './ContactRow';
import { useContacts } from './hooks';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hot', label: 'Hot' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'opted_out', label: 'Opted out' },
];

// Shared by the Contacts tab (filters + add/import) and the Hot list screen (`fixedFilter="hot"`).
// Long-press a contact to select several, then act on all of them at once.
export function ContactsList({ fixedFilter }) {
  const user = useUser();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { colors, radius, spacing, fontSize } = useTheme();
  const [filter, setFilter] = useState('all');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [actionsOpen, setActionsOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagText, setTagText] = useState('');
  const [busy, setBusy] = useState(false);
  const activeFilter = fixedFilter ?? filter;

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useContacts({
    search,
    filter: activeFilter,
  });
  const contacts = useMemo(() => data?.pages.flatMap((p) => p.contacts) ?? [], [data]);
  const total = data?.pages[0]?.meta.total;

  // Only contacts on screen count: changing the search or filter quietly drops the ones that left the list.
  const picked = useMemo(() => contacts.filter((c) => selected.has(c.id)), [contacts, selected]);
  const selecting = picked.length > 0;

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = () => setSelected(new Set());

  const open = useCallback(
    (c) => (selecting ? toggle(c.id) : router.push({ pathname: '/contact/[id]', params: { id: c.id } })),
    [selecting, toggle],
  );
  const renderItem = useCallback(
    ({ item, index }) => (
      <FadeInItem index={index}>
        <ContactRow
          contact={item}
          onPress={open}
          onLongPress={(c) => {
            haptics.press();
            toggle(c.id);
          }}
          showHot={activeFilter === 'hot'}
          selectionMode={selecting}
          selected={selected.has(item.id)}
        />
      </FadeInItem>
    ),
    [open, toggle, activeFilter, selecting, selected],
  );

  const canCreate = !fixedFilter && can(user, 'contacts.create');
  const canImport = !fixedFilter && can(user, 'contacts.import');
  const canUpdate = can(user, 'contacts.update');
  const canDelete = can(user, 'contacts.delete');
  const canMessage = can(user, 'whatsapp.manage');
  const menu = [
    ...(canCreate ? [{ label: 'Add contact', icon: 'person-add-outline', onPress: () => router.push('/contact-form') }] : []),
    ...(canImport ? [{ label: 'Import from phone contacts', icon: 'phone-portrait-outline', onPress: () => router.push({ pathname: '/import-contacts', params: { source: 'phone' } }) }] : []),
    ...(canImport ? [{ label: 'Import CSV file', icon: 'document-text-outline', onPress: () => router.push({ pathname: '/import-contacts', params: { source: 'csv' } }) }] : []),
  ];

  // Runs one bulk action, then tells the user how it went (failures are listed, never silent).
  async function perform(run, doneText) {
    setBusy(true);
    try {
      const result = await run(picked);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact'] });
      clearSelection();
      if (result.failures.length === 0) {
        toast.show(`${doneText} (${result.done})`);
      } else {
        Alert.alert(
          'Some contacts could not be updated',
          `${result.done} of ${result.total} done. ${result.failures.length} failed: ${result.failures[0].message}`,
        );
      }
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete contacts', `Remove ${picked.length} ${picked.length === 1 ? 'contact' : 'contacts'}? Their chats stay in the inbox.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => perform(bulkActions.remove, 'Deleted') },
    ]);
  }

  function confirmBlacklist() {
    Alert.alert('Add to black list', `${picked.length} ${picked.length === 1 ? 'number' : 'numbers'} will be left out of every campaign and bulk send.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: () => perform(bulkActions.blacklist, 'Added to black list') },
    ]);
  }

  function sendBulkMessage() {
    // Blocked and opted-out contacts must not be messaged.
    const reachable = picked.filter((c) => !c.is_blocked && !c.opted_out && c.wa_id);
    if (reachable.length === 0) {
      toast.show('None of the selected contacts can be messaged', 'error');
      return;
    }
    if (reachable.length < picked.length) toast.show(`${picked.length - reachable.length} blocked or opted-out skipped`, 'info');
    router.push({ pathname: '/bulk-form', params: { numbers: reachable.map((c) => c.wa_id).join('\n') } });
    clearSelection();
  }

  const allBlocked = picked.length > 0 && picked.every((c) => c.is_blocked);
  const allOptedOut = picked.length > 0 && picked.every((c) => c.opted_out);
  const actions = [
    ...(canMessage ? [{ label: 'Send bulk message', icon: 'paper-plane-outline', onPress: sendBulkMessage }] : []),
    ...(canUpdate ? [{ label: 'Add tags', icon: 'pricetag-outline', onPress: () => { setTagText(''); setTagOpen(true); } }] : []),
    ...(canUpdate ? [{ label: allBlocked ? 'Unblock' : 'Block', icon: 'ban-outline', onPress: () => perform((cs) => bulkActions.setBlocked(cs, !allBlocked), allBlocked ? 'Unblocked' : 'Blocked') }] : []),
    ...(canUpdate ? [{ label: allOptedOut ? 'Mark as opted in' : 'Mark as opted out', icon: 'notifications-off-outline', onPress: () => perform((cs) => bulkActions.setOptedOut(cs, !allOptedOut), 'Updated') }] : []),
    ...(canDelete ? [{ label: 'Add to black list', icon: 'shield-outline', onPress: confirmBlacklist }] : []),
    ...(canDelete ? [{ label: 'Delete', icon: 'trash-outline', danger: true, onPress: confirmDelete }] : []),
  ];

  function submitTags() {
    const tags = tagText.trim();
    if (!tags) return;
    setTagOpen(false);
    perform((cs) => bulkActions.addTags(cs, tags), 'Tags added');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {selecting ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.primaryDark }}>
          <Pressable onPress={clearSelection} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel selection">
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={{ flex: 1, color: '#fff', fontWeight: '700' }}>{picked.length} selected</Text>
          <Pressable onPress={() => setSelected(new Set(contacts.map((c) => c.id)))} hitSlop={8} accessibilityRole="button">
            <Text variant="small" style={{ color: '#fff', fontWeight: '600' }}>Select all</Text>
          </Pressable>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : actions.length > 0 ? (
            <Pressable onPress={() => setActionsOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Actions for selected contacts">
              <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={{ padding: spacing.md, gap: spacing.sm, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md }}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Search name, number, email or tag"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              autoCorrect={false}
              style={{ flex: 1, color: colors.text, fontFamily: fontRegular, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
            />
            {input ? (
              <Pressable onPress={() => setInput('')} hitSlop={8} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          {fixedFilter ? null : (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{ paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: active ? colors.primary : colors.chipBg }}
                  >
                    <Text variant="small" style={{ color: active ? '#fff' : colors.primary, fontWeight: '600' }}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {total !== undefined ? <Text variant="caption" muted>{total} {total === 1 ? 'contact' : 'contacts'}. Long-press one to select several.</Text> : null}
        </View>
      )}

      {isError && !data ? (
        <View style={{ padding: spacing.lg }}>
          <Banner message={error.message} />
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          extraData={selected}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon={activeFilter === 'hot' ? 'flame-outline' : 'people-outline'}
              title={search ? 'No matching contacts' : activeFilter === 'hot' ? 'No hot leads yet' : 'No contacts yet'}
              message={search ? 'Try a different name, number or tag.' : activeFilter === 'hot' ? 'Customers who show buying interest will appear here.' : canCreate ? 'Add one by one, or import from your phone or a CSV file.' : undefined}
              action={!search && activeFilter === 'all' && canCreate ? { label: 'Add contact', icon: 'person-add-outline', onPress: () => router.push('/contact-form') } : undefined}
            />
          }
          contentContainerStyle={contacts.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
        />
      )}

      {menu.length > 0 && !selecting ? (
        <Fab onPress={() => setMenuOpen(true)} label="Add or import contacts" />
      ) : null}
      <ActionSheet visible={menuOpen} title="Contacts" actions={menu} onClose={() => setMenuOpen(false)} />
      <ActionSheet visible={actionsOpen} title={`${picked.length} selected`} actions={actions} onClose={() => setActionsOpen(false)} />

      <Sheet visible={tagOpen} title="Add tags" onClose={() => setTagOpen(false)}>
        <Text variant="small" muted style={{ marginBottom: spacing.md }}>
          Added to the {picked.length} selected {picked.length === 1 ? 'contact' : 'contacts'}. Existing tags are kept. Separate several with a comma.
        </Text>
        <Input label="Tags" value={tagText} onChangeText={setTagText} autoCapitalize="none" placeholder="vip, delhi" />
        <Button title="Add tags" disabled={!tagText.trim()} onPress={submitTags} />
      </Sheet>
    </View>
  );
}
