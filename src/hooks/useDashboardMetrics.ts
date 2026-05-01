import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';

export interface DashboardMetrics {
  totalProjects: number;
  totalBudget: number;
  totalDepenses: number;
  totalRapports: number;
  sectionData: { name: string; value: number }[];
  riskData: { name: string; value: number }[];
  bailleurData: { name: string; value: number }[];
  budgetByProject: { name: string; budget: number; depenses: number }[];
  timelineData: { periode: string; depenses: number }[];
  countries: string[];
}

const EMPTY: DashboardMetrics = {
  totalProjects: 0,
  totalBudget: 0,
  totalDepenses: 0,
  totalRapports: 0,
  sectionData: [],
  riskData: [],
  bailleurData: [],
  budgetByProject: [],
  timelineData: [],
  countries: [],
};

export function useDashboardMetrics(filters: { pays?: string; periodicite?: string }) {
  const { user } = useAuth();
  const { activeOrgId } = useOrganization();

  return useQuery({
    queryKey: ['dashboard-metrics', activeOrgId, filters],
    enabled: !!user,
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data, error } = await supabase.rpc('get_dashboard_metrics' as any, {
        _org_id: activeOrgId ?? null,
        _pays: filters.pays || null,
        _periodicite: filters.periodicite || null,
      });
      if (error) throw error;
      return { ...EMPTY, ...((data as any) ?? {}) };
    },
  });
}
