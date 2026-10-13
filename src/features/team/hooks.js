import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as agentsApi from '@/api/agents';
import * as teamApi from '@/api/team';

export const useTeam = (enabled = true) => useQuery({ queryKey: ['team'], queryFn: teamApi.listTeam, enabled });

function useTeamMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    // Team changes also change who can be assigned chats and the agent workload list.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export const useCreateMember = () => useTeamMutation(teamApi.createMember);
export const useUpdateMember = () => useTeamMutation(({ id, ...body }) => teamApi.updateMember(id, body));
export const useToggleMember = () => useTeamMutation(teamApi.toggleMember);
export const useRemoveMember = () => useTeamMutation(teamApi.removeMember);

export const useAgents = (enabled = true) =>
  useQuery({
    queryKey: ['agents', 'list'],
    queryFn: async () => {
      // Per-status workload is a nice-to-have; the roster still loads without it.
      const [list, stats] = await Promise.all([agentsApi.listAgents(), agentsApi.agentStats().catch(() => ({ stats: [] }))]);
      const byId = new Map(stats.stats.map((s) => [s.id, s]));
      return list.agents.map((a) => ({ ...a, stats: byId.get(a.id) ?? null }));
    },
    enabled,
  });

export const useAgent = (id) => useQuery({ queryKey: ['agents', 'detail', id], queryFn: () => agentsApi.getAgent(id), enabled: !!id });

export const useAssignableAgents = (enabled = true) =>
  useQuery({ queryKey: ['agents', 'assignable'], queryFn: agentsApi.assignableAgents, enabled, staleTime: 60_000 });

// Reassigning a chat changes the inbox list (agent label, visibility for agents) and agent workloads.
function useAssignMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export const useAssignConversation = () => useAssignMutation(agentsApi.assignConversation);
export const useUnassignConversation = () => useAssignMutation(agentsApi.unassignConversation);
