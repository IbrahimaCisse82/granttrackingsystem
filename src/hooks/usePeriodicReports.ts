import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'validated';

export interface PeriodicReport {
  id: string;
  project_id: string;
  organization_id: string;
  report_index: number;
  period_start: string | null;
  period_end: string | null;
  status: ReportStatus;
  deadline_approval: string | null;
  depenses: Record<string, number>;
  previsions: Record<string, Record<string, number>>;
  explanation: Record<string, string>;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function usePeriodicReports(projectId?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const list = useQuery({
    queryKey: ['periodic-reports', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('periodic_reports')
        .select('*')
        .eq('project_id', projectId)
        .order('report_index', { ascending: true });
      if (error) throw error;
      return (data || []) as PeriodicReport[];
    },
    enabled: !!projectId,
  });

  async function logTransition(
    report: PeriodicReport,
    toStatus: ReportStatus,
    reason?: string
  ) {
    if (!user) return;
    await supabase.from('approval_workflows').insert({
      organization_id: report.organization_id,
      entity_type: 'periodic_report',
      entity_id: report.id,
      project_id: report.project_id,
      from_status: report.status,
      to_status: toStatus,
      reason: reason ?? null,
      actor_id: user.id,
      deadline: report.deadline_approval,
    });
  }

  const submit = useMutation({
    mutationFn: async (report: PeriodicReport) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase
        .from('periodic_reports')
        .update({ status: 'submitted', submitted_at: new Date().toISOString(), submitted_by: user.id })
        .eq('id', report.id);
      if (error) throw error;
      await logTransition(report, 'submitted');
    },
    onSuccess: () => {
      toast.success('Rapport soumis pour approbation');
      qc.invalidateQueries({ queryKey: ['periodic-reports'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: async (report: PeriodicReport) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase
        .from('periodic_reports')
        .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user.id })
        .eq('id', report.id);
      if (error) throw error;
      await logTransition(report, 'approved');
    },
    onSuccess: () => {
      toast.success('Rapport approuvé');
      qc.invalidateQueries({ queryKey: ['periodic-reports'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async ({ report, reason }: { report: PeriodicReport; reason: string }) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase
        .from('periodic_reports')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', report.id);
      if (error) throw error;
      await logTransition(report, 'rejected', reason);
    },
    onSuccess: () => {
      toast.success('Rapport rejeté');
      qc.invalidateQueries({ queryKey: ['periodic-reports'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { reports: list.data || [], isLoading: list.isLoading, submit, approve, reject };
}
