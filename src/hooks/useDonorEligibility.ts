import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DonorRuleType = 'allowed' | 'forbidden' | 'capped';
export type DonorDocPhase = 'contract' | 'reporting' | 'closure';

export interface DonorEligibilityRule {
  id: string;
  organization_id: string;
  donor_name: string;
  category: string;
  rule_type: DonorRuleType;
  cap_pct: number | null;
  cap_amount: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DonorDocument {
  id: string;
  organization_id: string;
  donor_name: string;
  doc_key: string;
  doc_label: string;
  mandatory: boolean;
  phase: DonorDocPhase;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useDonorEligibility(orgId: string | null | undefined) {
  const qc = useQueryClient();

  const rules = useQuery({
    queryKey: ['donor-eligibility-rules', orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<DonorEligibilityRule[]> => {
      const { data, error } = await (supabase as any)
        .from('donor_eligibility_rules')
        .select('*')
        .eq('organization_id', orgId)
        .order('donor_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const documents = useQuery({
    queryKey: ['donor-documents', orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<DonorDocument[]> => {
      const { data, error } = await (supabase as any)
        .from('donor_document_checklist')
        .select('*')
        .eq('organization_id', orgId)
        .order('donor_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const upsertRule = useMutation({
    mutationFn: async (r: Partial<DonorEligibilityRule> & { organization_id: string; donor_name: string; category: string }) => {
      const { id, ...rest } = r;
      if (id) {
        const { error } = await (supabase as any).from('donor_eligibility_rules').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('donor_eligibility_rules').insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Règle enregistrée');
      qc.invalidateQueries({ queryKey: ['donor-eligibility-rules', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('donor_eligibility_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Règle supprimée');
      qc.invalidateQueries({ queryKey: ['donor-eligibility-rules', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertDoc = useMutation({
    mutationFn: async (d: Partial<DonorDocument> & { organization_id: string; donor_name: string; doc_key: string; doc_label: string }) => {
      const { id, ...rest } = d;
      if (id) {
        const { error } = await (supabase as any).from('donor_document_checklist').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('donor_document_checklist').insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Document enregistré');
      qc.invalidateQueries({ queryKey: ['donor-documents', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('donor_document_checklist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document supprimé');
      qc.invalidateQueries({ queryKey: ['donor-documents', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    rules: rules.data || [],
    documents: documents.data || [],
    isLoading: rules.isLoading || documents.isLoading,
    upsertRule,
    deleteRule,
    upsertDoc,
    deleteDoc,
  };
}
