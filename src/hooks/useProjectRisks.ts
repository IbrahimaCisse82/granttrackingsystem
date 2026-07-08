import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RiskCategory = 'operational' | 'financial' | 'security' | 'reputation' | 'compliance' | 'other';
export type RiskStatus = 'open' | 'mitigated' | 'closed';

export interface ProjectRisk {
  id: string;
  project_id: string;
  organization_id: string;
  category: RiskCategory;
  description: string;
  likelihood: number;
  impact: number;
  score: number;
  mitigation: string;
  owner: string;
  status: RiskStatus;
  review_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectRisks(projectId: string | undefined) {
  const qc = useQueryClient();
  const key = ['project-risks', projectId];

  const query = useQuery({
    queryKey: key,
    enabled: !!projectId,
    queryFn: async (): Promise<ProjectRisk[]> => {
      const { data, error } = await (supabase as any)
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId)
        .order('score', { ascending: false });
      if (error) throw error;
      return (data as ProjectRisk[]) ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: Partial<ProjectRisk> & { organization_id: string }) => {
      const u = (await supabase.auth.getUser()).data.user;
      const { error } = await (supabase as any).from('project_risks').insert({
        project_id: projectId,
        organization_id: payload.organization_id,
        category: payload.category ?? 'operational',
        description: payload.description ?? '',
        likelihood: payload.likelihood ?? 3,
        impact: payload.impact ?? 3,
        mitigation: payload.mitigation ?? '',
        owner: payload.owner ?? '',
        status: payload.status ?? 'open',
        review_date: payload.review_date ?? null,
        created_by: u?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ProjectRisk> & { id: string }) => {
      const { error } = await (supabase as any).from('project_risks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('project_risks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { ...query, risks: query.data ?? [], create, update, remove };
}
