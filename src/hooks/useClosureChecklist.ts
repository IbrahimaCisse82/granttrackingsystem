import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClosureItem {
  id: string;
  item_key: string;
  item_label: string;
  item_order: number;
  checked: boolean;
  checked_at: string | null;
  notes: string;
}

export function useClosureChecklist(projectId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['closure', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ClosureItem[]> => {
      let { data, error } = await (supabase as any)
        .from('project_closure_checklists')
        .select('id,item_key,item_label,item_order,checked,checked_at,notes')
        .eq('project_id', projectId)
        .order('item_order');
      if (error) throw error;
      if (!data || data.length === 0) {
        // Seed
        const { error: seedErr } = await (supabase as any).rpc('seed_closure_checklist', { _project_id: projectId });
        if (seedErr) throw seedErr;
        const res = await (supabase as any)
          .from('project_closure_checklists')
          .select('id,item_key,item_label,item_order,checked,checked_at,notes')
          .eq('project_id', projectId)
          .order('item_order');
        data = res.data;
      }
      return (data as ClosureItem[]) ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (payload: { id: string; checked?: boolean; notes?: string }) => {
      const patch: any = {};
      if ('checked' in payload) {
        patch.checked = payload.checked;
        patch.checked_at = payload.checked ? new Date().toISOString() : null;
        const u = (await supabase.auth.getUser()).data.user;
        patch.checked_by = payload.checked ? u?.id ?? null : null;
      }
      if ('notes' in payload) patch.notes = payload.notes;
      const { error } = await (supabase as any)
        .from('project_closure_checklists')
        .update(patch)
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['closure', projectId] }),
  });

  const items = query.data ?? [];
  const total = items.length;
  const done = items.filter(i => i.checked).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return { ...query, items, total, done, progress, update };
}
