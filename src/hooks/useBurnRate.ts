import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';

export interface BurnRateProject {
  id: string;
  org: string;
  title: string;
  debut: string;
  fin: string;
  budget_total: number;
  depenses_total: number;
  elapsed_pct: number;
  burn_pct: number;
  variance: number;
  forecast_end: string | null;
  status: 'on_track' | 'under' | 'over';
}

export interface BurnRateData {
  projects: BurnRateProject[];
  alertCount: number;
}

export function useBurnRate() {
  const { user } = useAuth();
  const { activeOrgId } = useOrganization();
  return useQuery({
    queryKey: ['burn-rate', activeOrgId],
    enabled: !!user,
    queryFn: async (): Promise<BurnRateData> => {
      const { data, error } = await supabase.rpc('get_burn_rate_analysis' as any, {
        _org_id: activeOrgId ?? null,
      });
      if (error) throw error;
      return (data as any) ?? { projects: [], alertCount: 0 };
    },
  });
}
