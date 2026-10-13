import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/templates';

// status: '' (all) | APPROVED | PENDING | REJECTED
export function useTemplates({ search, status }) {
  return useInfiniteQuery({
    queryKey: ['templates', 'list', { search: search ?? '', status: status ?? '' }],
    queryFn: ({ pageParam }) => api.listTemplates({ search: search || undefined, status: status || undefined, page: pageParam, perPage: 30 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useTemplate(id) {
  return useQuery({ queryKey: ['templates', 'detail', id], queryFn: () => api.getTemplate(id), enabled: !!id });
}

// Anything that changes templates also refreshes the inbox's "approved templates" picker (same ['templates'] prefix).
function useTemplateMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }) });
}

export const useCreateTemplate = () => useTemplateMutation(api.createTemplate);
export const useDeleteTemplate = () => useTemplateMutation(api.deleteTemplate);
export const useSyncTemplates = () => useTemplateMutation(api.syncTemplates);
