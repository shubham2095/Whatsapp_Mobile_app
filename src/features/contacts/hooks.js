import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as blacklistApi from '@/api/blacklist';
import * as contactsApi from '@/api/contacts';

const nextPage = (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined);

// filter: 'all' | 'hot' | 'blocked' | 'opted_out'
export function useContacts({ search, filter }) {
  return useInfiniteQuery({
    queryKey: ['contacts', { search: search ?? '', filter }],
    queryFn: ({ pageParam }) =>
      contactsApi.listContacts({
        search,
        hot: filter === 'hot',
        blocked: filter === 'blocked',
        optedOut: filter === 'opted_out',
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
  });
}

export function useContact(id) {
  return useQuery({ queryKey: ['contact', id], queryFn: () => contactsApi.getContact(id), enabled: !!id });
}

function useRefreshContacts() {
  const queryClient = useQueryClient();
  return (id) => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    if (id) queryClient.invalidateQueries({ queryKey: ['contact', id] });
  };
}

export function useCreateContact() {
  const refresh = useRefreshContacts();
  return useMutation({ mutationFn: contactsApi.createContact, onSuccess: () => refresh() });
}

export function useUpdateContact(id) {
  const refresh = useRefreshContacts();
  return useMutation({ mutationFn: (body) => contactsApi.updateContact(id, body), onSuccess: () => refresh(id) });
}

export function useDeleteContact() {
  const refresh = useRefreshContacts();
  return useMutation({ mutationFn: contactsApi.deleteContact, onSuccess: () => refresh() });
}

export function useBlacklist({ search }) {
  return useInfiniteQuery({
    queryKey: ['blacklist', { search: search ?? '' }],
    queryFn: ({ pageParam }) => blacklistApi.listBlacklist({ search, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
  });
}

export function useAddToBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blacklistApi.addToBlacklist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklist'] }),
  });
}

export function useRemoveFromBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: blacklistApi.removeFromBlacklist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklist'] }),
  });
}
