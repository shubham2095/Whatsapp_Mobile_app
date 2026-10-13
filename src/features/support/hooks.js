import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as supportApi from '@/api/support';

export function useTickets({ admin, status, search }) {
  return useInfiniteQuery({
    queryKey: ['support', 'list', { admin: !!admin, status: status ?? '', search: search ?? '' }],
    queryFn: ({ pageParam }) => supportApi.listTickets({ admin, status: status || undefined, search: search || undefined, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export const useTicket = (id) => useQuery({ queryKey: ['support', 'detail', id], queryFn: () => supportApi.getTicket(id), enabled: !!id });

function useSupportMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support'] }) });
}

export const useCreateTicket = () => useSupportMutation(supportApi.createTicket);
export const useReplyToTicket = () => useSupportMutation(({ id, ...body }) => supportApi.replyToTicket(id, body));
