import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as wa from '@/api/whatsapp';

export function useNumbers(enabled = true) {
  return useQuery({ queryKey: ['wa-numbers'], queryFn: wa.listNumbers, enabled, staleTime: 5 * 60_000 });
}

// Runs a number action, then refreshes the list (and anything chat-related that depends on the number).
function useNumberAction(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wa-numbers'] }),
  });
}

export const useConnectNumber = () => useNumberAction(wa.connectManual);
export const useSyncNumber = () => useNumberAction(wa.syncNumber);
export const useRegisterNumber = () => useNumberAction(({ id, pin }) => wa.registerNumber(id, pin));
export const useSubscribeApp = () => useNumberAction(wa.subscribeApp);
export const useUpdateToken = () => useNumberAction(({ id, token }) => wa.updateToken(id, token));
export const useDisconnectNumber = () => useNumberAction(wa.disconnectNumber);

export function useSendTest() {
  return useMutation({ mutationFn: ({ id, ...body }) => wa.sendTest(id, body) });
}
