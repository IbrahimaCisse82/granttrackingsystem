import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAuditLog } from './useAuditLog';
import type { Project } from '@/lib/mock-data';
import { toast } from 'sonner';

// Map DB row to Project interface
function rowToProject(row: any): Project & { userId: string; archived: boolean } {
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
    createdAt: new Date(row.created_at).getTime(),
    userId: row.user_id,
    archived: row.archived ?? false,
  };
}

function projectToRow(p: Omit<Project, 'id' | 'createdAt'>, userId: string) {
  return {
    user_id: userId,
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

export function useProjects() {
  const { user } = useAuth();
  const { log: auditLog } = useAuditLog();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToProject);
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('projects')
        .insert(projectToRow(project, user.id))
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

      const { error } = await supabase
        .from('projects')
        .update(row)
        .eq('id', id);
      if (error) throw error;
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

  return {
    projects: query.data || [],
    isLoading: query.isLoading,
    addProject: addMutation.mutateAsync,
    updateProject: (id: string, updates: Partial<Project>) => updateMutation.mutateAsync({ id, updates }),
    updateProjectFn: (id: string, updater: (p: Project) => Project) => {
      const project = query.data?.find(p => p.id === id);
      if (!project) return;
      const updated = updater(project);
      return updateMutation.mutateAsync({ id, updates: updated });
    },
    deleteProject: deleteMutation.mutateAsync,
    archiveProject: (id: string, archived: boolean) => archiveMutation.mutateAsync({ id, archived }),
    isAdding: addMutation.isPending,
  };
}
