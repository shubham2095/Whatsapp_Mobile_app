import { useQuery } from '@tanstack/react-query';
import * as analytics from '@/api/analytics';

export const useDashboardStats = (enabled) =>
  useQuery({ queryKey: ['analytics', 'dashboard'], queryFn: analytics.dashboardStats, enabled, staleTime: 60_000 });

export const useMessageStats = (days, enabled = true) =>
  useQuery({ queryKey: ['analytics', 'messages', days], queryFn: () => analytics.messageStats(days), enabled, staleTime: 60_000 });

export const useCampaignStats = (enabled = true) =>
  useQuery({ queryKey: ['analytics', 'campaigns'], queryFn: analytics.campaignStats, enabled, staleTime: 60_000 });
