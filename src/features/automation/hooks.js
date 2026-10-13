import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/automations';
import * as botApi from '@/api/chatbot';
import * as socialApi from '@/api/social';

const nextPage = (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined);

// ---- chatbots ----

export function useChatbots() {
  return useInfiniteQuery({
    queryKey: ['chatbots', 'list'],
    queryFn: ({ pageParam }) => botApi.listChatbots({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
  });
}

export const useChatbot = (id) => useQuery({ queryKey: ['chatbots', 'detail', id], queryFn: () => botApi.getChatbot(id), enabled: !!id });

function useBotMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatbots'] }) });
}

export const useCreateChatbot = () => useBotMutation(botApi.createChatbot);
export const useUpdateChatbot = () => useBotMutation(({ id, ...body }) => botApi.updateChatbot(id, body));
export const useDeleteChatbot = () => useBotMutation(botApi.deleteChatbot);
export const useToggleChatbot = () => useBotMutation(botApi.toggleChatbot);
export const useAddRule = () => useBotMutation(({ id, ...body }) => botApi.addRule(id, body));
export const useUpdateRule = () => useBotMutation(({ id, ruleId, ...body }) => botApi.updateRule(id, ruleId, body));
export const useDeleteRule = () => useBotMutation(({ id, ruleId }) => botApi.deleteRule(id, ruleId));

// ---- automations (workflows) ----

export function useWorkflows({ status } = {}) {
  return useInfiniteQuery({
    queryKey: ['workflows', 'list', { status: status ?? '' }],
    queryFn: ({ pageParam }) => api.listWorkflows({ status: status || undefined, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
  });
}

export const useWorkflow = (id) => useQuery({ queryKey: ['workflows', 'detail', id], queryFn: () => api.getWorkflow(id), enabled: !!id });

export function useExecutions(id) {
  return useInfiniteQuery({
    queryKey: ['workflows', 'executions', id],
    queryFn: ({ pageParam }) => api.listExecutions(id, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: !!id,
  });
}

function useWorkflowMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }) });
}

export const useActivateWorkflow = () => useWorkflowMutation(api.activateWorkflow);
export const usePauseWorkflow = () => useWorkflowMutation(api.pauseWorkflow);
export const useDeleteWorkflow = () => useWorkflowMutation(api.deleteWorkflow);

// ---- social publishing ----

export const useSocialConnection = () => useQuery({ queryKey: ['social', 'connection'], queryFn: socialApi.getConnection });
export const useSocialPosts = () => useQuery({ queryKey: ['social', 'posts'], queryFn: socialApi.listPosts });

function useSocialMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social'] }) });
}

export const useConnectPage = () => useSocialMutation(socialApi.connectPage);
export const useRecheckInstagram = () => useSocialMutation(socialApi.recheckInstagram);
export const useDisconnectSocial = () => useSocialMutation(socialApi.disconnect);
export const useCreatePost = () => useSocialMutation(socialApi.createPost);
export const usePublishPost = () => useSocialMutation(socialApi.publishPost);
export const useUpdatePost = () => useSocialMutation(({ id, ...body }) => socialApi.updatePost(id, body));
export const useDeletePost = () => useSocialMutation(socialApi.deletePost);
