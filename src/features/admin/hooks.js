import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as admin from '@/api/admin';

export const useCompanies = (enabled = true) => useQuery({ queryKey: ['admin', 'companies'], queryFn: admin.listCompanies, enabled });
export const useAdminPlans = (enabled = true) => useQuery({ queryKey: ['admin', 'plans'], queryFn: admin.listAdminPlans, enabled });
export const useCompanyUsers = (id, enabled = true) =>
  useQuery({ queryKey: ['admin', 'users', id], queryFn: () => admin.companyUsers(id), enabled: enabled && !!id });
export const useAdminSettings = () => useQuery({ queryKey: ['admin', 'settings'], queryFn: admin.getSettings });

// Company and plan changes affect each other's counts (subscribers, plan names), so refresh both.
function useAdminMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }) });
}

export const useCreateCompany = () => useAdminMutation(admin.createCompany);
export const useToggleCompany = () => useAdminMutation(admin.toggleCompany);
export const useAssignPlan = () => useAdminMutation(admin.assignPlan);
export const useDeleteCompany = () => useAdminMutation(admin.deleteCompany);
export const useResetUserPassword = () => useMutation({ mutationFn: admin.resetUserPassword });

export const useCreatePlan = () => useAdminMutation(admin.createPlan);
export const useUpdatePlan = () => useAdminMutation(admin.updatePlan);
export const useTogglePlan = () => useAdminMutation(admin.togglePlan);
export const useDeletePlan = () => useAdminMutation(admin.deletePlan);
export const useUpdateSettings = () => useAdminMutation(admin.updateSettings);
