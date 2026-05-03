import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ExchangeRate {
  id: string;
  organization_id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  source: string;
  created_at: string;
}

export const ISO_CURRENCIES = ['XOF', 'EUR', 'USD', 'GBP', 'CAD', 'CHF', 'JPY', 'CNY', 'MAD', 'NGN'] as const;

export function useExchangeRates(orgId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['exchange-rates', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('organization_id', orgId)
        .order('rate_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as ExchangeRate[];
    },
    enabled: !!orgId,
  });

  const add = useMutation({
    mutationFn: async (input: Omit<ExchangeRate, 'id' | 'created_at' | 'organization_id'>) => {
      if (!orgId || !user) throw new Error('Contexte invalide');
      const { error } = await supabase.from('exchange_rates').insert({
        ...input,
        organization_id: orgId,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Taux ajouté');
      qc.invalidateQueries({ queryKey: ['exchange-rates', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exchange_rates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Taux supprimé');
      qc.invalidateQueries({ queryKey: ['exchange-rates', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { rates: list.data || [], isLoading: list.isLoading, add, remove };
}
