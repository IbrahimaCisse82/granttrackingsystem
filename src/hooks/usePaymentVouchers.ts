import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type VoucherStatus = 'pending' | 'received' | 'reconciled';

export interface PaymentVoucher {
  id: string;
  project_id: string;
  organization_id: string;
  report_id: string | null;
  voucher_number: string;
  amount_local: number;
  amount_eur: number | null;
  currency: string;
  exchange_rate: number | null;
  payment_date: string;
  donor_reference: string | null;
  bank_reference: string | null;
  status: VoucherStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePaymentVouchers(projectId?: string, orgId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['payment-vouchers', projectId, orgId],
    queryFn: async () => {
      let q = supabase.from('payment_vouchers').select('*').order('payment_date', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      else if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data || []) as PaymentVoucher[];
    },
    enabled: !!(projectId || orgId),
  });

  const add = useMutation({
    mutationFn: async (input: Omit<PaymentVoucher, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('payment_vouchers').insert({
        ...input,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fiche de versement créée');
      qc.invalidateQueries({ queryKey: ['payment-vouchers'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PaymentVoucher> }) => {
      const { error } = await supabase.from('payment_vouchers').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fiche mise à jour');
      qc.invalidateQueries({ queryKey: ['payment-vouchers'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_vouchers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fiche supprimée');
      qc.invalidateQueries({ queryKey: ['payment-vouchers'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { vouchers: list.data || [], isLoading: list.isLoading, add, update, remove };
}
