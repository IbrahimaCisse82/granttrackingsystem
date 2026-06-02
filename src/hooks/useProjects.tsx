import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';
import { useAuditLog } from './useAuditLog';
import type { Project } from '@/lib/types';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

// Map DB row to Project interface
function rowToProject(row: any): Project & { userId: string; archived: boolean; organizationId?: string; version: number } {
  return {
    id: row.id,
    convention: row.convention,
    org: row.org,
    orgType: row.org_type,
    title: row.title,
    pays: row.pays,
    devise: row.devise,
    taux: Number(row.taux),
    risque: row.risque,
    debut: row.debut,
    fin: row.fin,
    periodicite: row.periodicite,
    color: row.color as Project['color'],
    budgetLines: row.budget_lines as Project['budgetLines'],
    reports: row.reports as Project['reports'],
    fiches: row.fiches as Project['fiches'],
    amendements: row.amendements as Project['amendements'],
    infos: row.infos as Project['infos'],
    indicators: row.indicators as any ?? [],
    bailleurs: row.bailleurs as any ?? [],
    createdAt: new Date(row.created_at).getTime(),
    userId: row.user_id,
    archived: row.archived ?? false,
    organizationId: row.organization_id,
    version: row.version ?? 1,
  };
}

function projectToRow(p: Omit<Project, 'id' | 'createdAt'>, userId: string, organizationId?: string | null) {
  return {
    user_id: userId,
    organization_id: organizationId || null,
    convention: p.convention,
    org: p.org,
    org_type: p.orgType,
    title: p.title,
    pays: p.pays,
    devise: p.devise,
    taux: p.taux,
    risque: p.risque,
    debut: p.debut,
    fin: p.fin,
    periodicite: p.periodicite,
    color: p.color as any,
    budget_lines: p.budgetLines as any,
    reports: p.reports as any,
    fiches: p.fiches as any,
    amendements: p.amendements as any,
    infos: p.infos as any,
  };
}

export type ProjectSortKey = 'created_at' | 'org' | 'debut' | 'fin' | 'pays';
export interface ProjectFilters {
  search?: string;
  risque?: string;
  pays?: string;
  archived?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: ProjectSortKey;
  sortDir?: 'asc' | 'desc';
}

export function useProjects(filters?: ProjectFilters) {
  const { user } = useAuth();
  const { activeOrgId } = useOrganization();
  const { log: auditLog } = useAuditLog();
  const queryClient = useQueryClient();

  const page = filters?.page ?? 0;
  const pageSize = filters?.pageSize ?? PAGE_SIZE;

  const query = useQuery({
    queryKey: ['projects', activeOrgId, filters],
    queryFn: async () => {
      // Count query
      let countQuery = supabase.from('projects').select('*', { count: 'exact', head: true });
      if (activeOrgId) countQuery = countQuery.eq('organization_id', activeOrgId);
      if (filters?.archived !== undefined) countQuery = countQuery.eq('archived', filters.archived);
      if (filters?.risque) countQuery = countQuery.eq('risque', filters.risque);
      if (filters?.pays) countQuery = countQuery.eq('pays', filters.pays);
      if (filters?.search) {
        countQuery = countQuery.or(`org.ilike.%${filters.search}%,convention.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }

      // Data query
      const sortBy = filters?.sortBy ?? 'created_at';
      const sortDir = filters?.sortDir ?? 'desc';
      let q = supabase.from('projects').select('*').order(sortBy, { ascending: sortDir === 'asc', nullsFirst: false });
      if (activeOrgId) q = q.eq('organization_id', activeOrgId);
      if (filters?.archived !== undefined) q = q.eq('archived', filters.archived);
      if (filters?.risque) q = q.eq('risque', filters.risque);
      if (filters?.pays) q = q.eq('pays', filters.pays);
      if (filters?.search) {
        q = q.or(`org.ilike.%${filters.search}%,convention.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;
      q = q.range(from, to);

      const [countResult, dataResult] = await Promise.all([countQuery, q]);
      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      return {
        projects: (dataResult.data || []).map(rowToProject),
        totalCount: countResult.count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((countResult.count ?? 0) / pageSize),
      };
    },
    placeholderData: keepPreviousData,
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('projects')
        .insert(projectToRow(project, user.id, activeOrgId))
        .select()
        .single();
      if (error) throw error;
      return rowToProject(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      auditLog('create', data.id, { description: `Projet ${data.org} créé` });
      toast.success('Projet créé');
    },
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const row: any = {};
      if (updates.convention !== undefined) row.convention = updates.convention;
      if (updates.org !== undefined) row.org = updates.org;
      if (updates.orgType !== undefined) row.org_type = updates.orgType;
      if (updates.title !== undefined) row.title = updates.title;
      if (updates.pays !== undefined) row.pays = updates.pays;
      if (updates.devise !== undefined) row.devise = updates.devise;
      if (updates.taux !== undefined) row.taux = updates.taux;
      if (updates.risque !== undefined) row.risque = updates.risque;
      if (updates.debut !== undefined) row.debut = updates.debut;
      if (updates.fin !== undefined) row.fin = updates.fin;
      if (updates.periodicite !== undefined) row.periodicite = updates.periodicite;
      if (updates.color !== undefined) row.color = updates.color as any;
      if (updates.budgetLines !== undefined) row.budget_lines = updates.budgetLines as any;
      if (updates.reports !== undefined) row.reports = updates.reports as any;
      if (updates.fiches !== undefined) row.fiches = updates.fiches as any;
      if (updates.amendements !== undefined) row.amendements = updates.amendements as any;
      if (updates.infos !== undefined) row.infos = updates.infos as any;
      if ((updates as any).indicators !== undefined) row.indicators = (updates as any).indicators as any;
      if ((updates as any).bailleurs !== undefined) row.bailleurs = (updates as any).bailleurs as any;

      // Optimistic locking: get current version from cache, send .eq('version', v)
      const current = (result.projects as any[]).find(p => p.id === id);
      const expectedVersion: number | undefined = current?.version;

      let q = supabase.from('projects').update(row).eq('id', id);
      if (typeof expectedVersion === 'number') q = q.eq('version', expectedVersion);
      const { data, error } = await q.select('id, version').maybeSingle();
      if (error) throw error;
      if (!data && typeof expectedVersion === 'number') {
        throw new Error('Conflit de version : ce projet a été modifié par un autre utilisateur. Rechargez la page.');
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet supprimé');
    },
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from('projects').update({ archived } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id, archived }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      auditLog(archived ? 'archive' : 'unarchive', id);
      toast.success(archived ? 'Projet archivé' : 'Projet désarchivé');
    },
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  const result = query.data ?? { projects: [], totalCount: 0, page: 0, pageSize, totalPages: 0 };

  return {
    projects: result.projects,
    totalCount: result.totalCount,
    totalPages: result.totalPages,
    currentPage: result.page,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    addProject: addMutation.mutateAsync,
    updateProject: (id: string, updates: Partial<Project>) => updateMutation.mutateAsync({ id, updates }),
    updateProjectFn: (id: string, updater: (p: Project) => Project) => {
      const project = result.projects.find(p => p.id === id);
      if (!project) return;
      const updated = updater(project);
      return updateMutation.mutateAsync({ id, updates: updated });
    },
    deleteProject: deleteMutation.mutateAsync,
    archiveProject: (id: string, archived: boolean) => archiveMutation.mutateAsync({ id, archived }),
    isAdding: addMutation.isPending,
  };
}
