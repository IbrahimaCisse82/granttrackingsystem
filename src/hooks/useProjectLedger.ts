import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Normalized budget lines (mirrored server-side from projects.budget_lines). */
export function useBudgetLines(projectId?: string) {
  return useQuery({
    queryKey: ['budget-lines', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('project_id', projectId!)
        .order('position');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Normalized, append-only transactions (mirrored server-side from projects.reports). */
export function useProjectTransactions(projectId?: string, reportIndex?: number) {
  return useQuery({
    queryKey: ['project-transactions', projectId, reportIndex],
    enabled: !!projectId,
    queryFn: async () => {
      let q = supabase.from('project_transactions').select('*').eq('project_id', projectId!);
      if (typeof reportIndex === 'number') q = q.eq('report_index', reportIndex);
      const { data, error } = await q.order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}
