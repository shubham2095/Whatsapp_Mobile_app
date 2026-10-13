import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as billing from '@/api/billing';

export const useBillingOverview = (enabled = true) =>
  useQuery({ queryKey: ['billing', 'overview'], queryFn: billing.overview, enabled });

export const usePlans = () => useQuery({ queryKey: ['billing', 'plans'], queryFn: billing.plans, staleTime: 5 * 60_000 });

export const useWallet = () => useQuery({ queryKey: ['billing', 'wallet'], queryFn: billing.wallet });

export function useInvoices() {
  return useInfiniteQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: ({ pageParam }) => billing.invoices({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export const useCreateOrder = () => useMutation({ mutationFn: billing.createOrder });

// A purchase changes the plan, wallet and invoices, so refresh everything billing-related.
export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: billing.verifyPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing'] }),
  });
}
