import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type FieldReportStatus = 'draft' | 'submitted' | 'reviewed';

export interface FieldReport {
  id: string;
  project_id: string;
  organization_id: string;
  beneficiary_id: string;
  period_start: string;
  period_end: string;
  narrative: string;
  indicators: any[];
  attachments: any[];
  status: FieldReportStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useFieldReports(projectId?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const list = useQuery({
    queryKey: ['field-reports', projectId, user?.id],
    queryFn: async () => {
      let q = supabase.from('field_reports').select('*').order('period_end', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as FieldReport[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: Omit<FieldReport, 'id' | 'created_at' | 'updated_at' | 'submitted_at' | 'reviewed_at' | 'reviewed_by' | 'review_notes'>) => {
      const { data, error } = await supabase.from('field_reports').insert(input as any).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('Rapport de terrain créé'); qc.invalidateQueries({ queryKey: ['field-reports'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('field_reports').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Rapport soumis'); qc.invalidateQueries({ queryKey: ['field-reports'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('field_reports').update({
        status: 'reviewed', reviewed_at: new Date().toISOString(), reviewed_by: user.id, review_notes: notes,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Rapport révisé'); qc.invalidateQueries({ queryKey: ['field-reports'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { reports: list.data || [], isLoading: list.isLoading, create, submit, review };
}
