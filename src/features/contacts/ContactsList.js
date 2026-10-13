import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionSheet, Banner, EmptyState, Text } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { can } from '@/lib/permissions';
import { useTheme } from '@/theme/ThemeProvider';
import { ContactRow } from './ContactRow';
import { useContacts } from './hooks';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hot', label: 'Hot' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'opted_out', label: 'Opted out' },
];

// Shared by the Contacts tab (filters + add/import) and the Hot list screen (`fixedFilter="hot"`).
export function ContactsList({ fixedFilter }) {
  const user = useUser();
  const { colors, radius, spacing, fontSize } = useTheme();
  const [filter, setFilter] = useState('all');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
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

  const open = useCallback((c) => router.push({ pathname: '/contact/[id]', params: { id: c.id } }), []);
  const renderItem = useCallback(({ item }) => <ContactRow contact={item} onPress={open} showHot={activeFilter === 'hot'} />, [open, activeFilter]);

  const canCreate = !fixedFilter && can(user, 'contacts.create');
  const canImport = !fixedFilter && can(user, 'contacts.import');
  const menu = [
    ...(canCreate ? [{ label: 'Add contact', icon: 'person-add-outline', onPress: () => router.push('/contact-form') }] : []),
    ...(canImport ? [{ label: 'Import from phone contacts', icon: 'phone-portrait-outline', onPress: () => router.push({ pathname: '/import-contacts', params: { source: 'phone' } }) }] : []),
    ...(canImport ? [{ label: 'Import CSV file', icon: 'document-text-outline', onPress: () => router.push({ pathname: '/import-contacts', params: { source: 'csv' } }) }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
            style={{ flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm }}
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
        {total !== undefined ? <Text variant="caption" muted>{total} {total === 1 ? 'contact' : 'contacts'}</Text> : null}
      </View>

      {isError && !data ? (
        <View style={{ padding: spacing.lg }}>
          <Banner message={error.message} />
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text color={colors.primary} style={{ fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon={activeFilter === 'hot' ? 'flame-outline' : 'people-outline'}
              title={search ? 'No matching contacts' : activeFilter === 'hot' ? 'No hot leads yet' : 'No contacts yet'}
              message={search ? 'Try a different name, number or tag.' : activeFilter === 'hot' ? 'Customers who show buying interest will appear here.' : canCreate ? 'Tap + to add a contact or import from your phone.' : undefined}
            />
          }
          contentContainerStyle={contacts.length === 0 ? { flexGrow: 1 } : { paddingBottom: 96 }}
        />
      )}

      {menu.length > 0 ? (
        <>
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Add or import contacts"
            style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </Pressable>
          <ActionSheet visible={menuOpen} title="Contacts" actions={menu} onClose={() => setMenuOpen(false)} />
        </>
      ) : null}
    </View>
  );
}
