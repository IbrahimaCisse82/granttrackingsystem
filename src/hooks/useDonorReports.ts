import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DonorTemplateSection {
  key: string;
  title: string;
  type: 'narrative' | 'budget' | 'expenses' | 'comparison' | 'indicators' | 'vouchers';
}

export interface DonorTemplate {
  id: string;
  organization_id: string;
  name: string;
  donor_name: string;
  periodicity: 'monthly' | 'quarterly' | 'semestrial' | 'annual';
  currency: string;
  sections: DonorTemplateSection[];
  created_at: string;
  updated_at: string;
}

export interface DonorRun {
  id: string;
  organization_id: string;
  project_id: string;
  template_id: string;
  period_start: string;
  period_end: string;
  payload: Record<string, unknown>;
  status: 'draft' | 'finalized';
  generated_at: string;
}

export function useDonorTemplates(orgId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['donor-templates', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('donor_report_templates')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DonorTemplate[];
    },
    enabled: !!orgId,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<DonorTemplate> & { id?: string }) => {
      if (!orgId || !user) throw new Error('Contexte invalide');
      if (input.id) {
        const { error } = await supabase.from('donor_report_templates').update({
          name: input.name, donor_name: input.donor_name, periodicity: input.periodicity,
          currency: input.currency, sections: input.sections as never,
        }).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('donor_report_templates').insert({
          organization_id: orgId, created_by: user.id,
          name: input.name!, donor_name: input.donor_name!,
          periodicity: input.periodicity || 'quarterly',
          currency: input.currency || 'EUR',
          sections: (input.sections || []) as never,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success('Modèle enregistré'); qc.invalidateQueries({ queryKey: ['donor-templates'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('donor_report_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Modèle supprimé'); qc.invalidateQueries({ queryKey: ['donor-templates'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { templates: list.data || [], isLoading: list.isLoading, upsert, remove };
}

export function useDonorRuns(orgId?: string, projectId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['donor-runs', orgId, projectId],
    queryFn: async () => {
      let q = supabase.from('donor_report_runs').select('*').order('generated_at', { ascending: false }).limit(200);
      if (projectId) q = q.eq('project_id', projectId);
      else if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as DonorRun[];
    },
    enabled: !!(orgId || projectId),
  });

  const generate = useMutation({
    mutationFn: async (input: Omit<DonorRun, 'id' | 'generated_at' | 'organization_id'> & { organization_id: string }) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('donor_report_runs').insert({
        ...input, generated_by: user.id, payload: input.payload as never,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Rapport bailleur généré'); qc.invalidateQueries({ queryKey: ['donor-runs'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('donor_report_runs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['donor-runs'] }); },
  });

  return { runs: list.data || [], isLoading: list.isLoading, generate, remove };
}
