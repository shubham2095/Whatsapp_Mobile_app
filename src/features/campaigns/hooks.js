import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import * as bulkApi from '@/api/bulk';
import * as campaignsApi from '@/api/campaigns';
import { useTemplate } from '@/features/templates/hooks';
import { variableNumbers } from '@/features/templates/meta';

// Sends continue on the server after the request ends, and every status poll nudges stalled
// ones along, so keep polling quickly while anything is in flight.
const ACTIVE_POLL_MS = 5_000;

const nextPage = (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined);

export function useCampaigns({ status } = {}) {
  const focused = useIsFocused();
  return useInfiniteQuery({
    queryKey: ['campaigns', 'list', { status: status ?? '' }],
    queryFn: ({ pageParam }) => campaignsApi.listCampaigns({ status: status || undefined, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      focused && query.state.data?.pages.some((p) => p.campaigns.some((c) => c.status === 'running')) ? ACTIVE_POLL_MS : false,
  });
}

// Campaign + its recipients, one page of recipients at a time.
export function useCampaign(id) {
  const focused = useIsFocused();
  return useInfiniteQuery({
    queryKey: ['campaigns', 'detail', id],
    queryFn: ({ pageParam }) => campaignsApi.getCampaign(id, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: !!id,
    refetchInterval: (query) => (focused && query.state.data?.pages[0]?.campaign.status === 'running' ? ACTIVE_POLL_MS : false),
  });
}

function useCampaignMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }) });
}

export const useCreateCampaign = () => useCampaignMutation(campaignsApi.createCampaign);
export const useStartCampaign = () => useCampaignMutation(campaignsApi.startCampaign);
export const usePauseCampaign = () => useCampaignMutation(campaignsApi.pauseCampaign);
export const useCancelCampaign = () => useCampaignMutation(campaignsApi.cancelCampaign);
export const useDeleteCampaign = () => useCampaignMutation(campaignsApi.deleteCampaign);

export function useBulkSends() {
  const focused = useIsFocused();
  return useInfiniteQuery({
    queryKey: ['bulk', 'list'],
    queryFn: ({ pageParam }) => bulkApi.listBulkSends({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      focused && query.state.data?.pages.some((p) => p.bulk_sends.some((s) => s.status === 'processing')) ? ACTIVE_POLL_MS : false,
  });
}

export function useBulkSend(id) {
  const focused = useIsFocused();
  return useQuery({
    queryKey: ['bulk', 'detail', id],
    queryFn: () => bulkApi.getBulkSend(id),
    enabled: !!id,
    refetchInterval: (query) => (focused && query.state.data?.bulk_send.status === 'processing' ? ACTIVE_POLL_MS : false),
  });
}

export function useSendBulk() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: bulkApi.sendBulk, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulk'] }) });
}

// Re-sends only the failed numbers. The server answers with the refreshed send, so the screen updates at once.
export function useRetryBulk(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => bulkApi.retryBulkSend(id),
    onSuccess: (data) => {
      queryClient.setQueryData(['bulk', 'detail', id], data);
      queryClient.invalidateQueries({ queryKey: ['bulk', 'list'] });
    },
  });
}

export const useUploadBulkHeader = () => useMutation({ mutationFn: bulkApi.uploadBulkHeader });

// What a chosen template needs filled in: how many {{n}} body variables, and a media header type.
export function useTemplateNeeds(templateId) {
  const query = useTemplate(templateId);
  const components = query.data?.template.components ?? [];
  const find = (type) => components.find((c) => String(c.type).toUpperCase() === type);
  const nums = variableNumbers(find('BODY')?.text ?? '');
  const headerFormat = String(find('HEADER')?.format ?? '').toUpperCase();
  return {
    isLoading: query.isLoading && !!templateId,
    isError: query.isError,
    varCount: nums.length ? Math.max(...nums) : 0,
    mediaHeader: ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat) ? headerFormat : null,
  };
}
