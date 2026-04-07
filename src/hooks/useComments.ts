import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  userId: string;
  projectId: string;
  reportIndex: number;
  content: string;
  createdAt: string;
  userName?: string;
}

export function useComments(projectId: string, reportIndex: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['comments', projectId, reportIndex];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments' as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('report_index', reportIndex)
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      const profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);
        (pData || []).forEach((p: any) => {
          profiles[p.user_id] = `${p.first_name} ${p.last_name}`.trim() || 'Utilisateur';
        });
      }

      return (data || []).map((c: any): Comment => ({
        id: c.id,
        userId: c.user_id,
        projectId: c.project_id,
        reportIndex: c.report_index,
        content: c.content,
        createdAt: c.created_at,
        userName: profiles[c.user_id] || 'Utilisateur',
      }));
    },
    enabled: !!projectId,
  });

  const addMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('comments' as any).insert({
        user_id: user.id,
        project_id: projectId,
        report_index: reportIndex,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Commentaire ajouté');
    },
    onError: (e) => toast.error('Erreur: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    comments: query.data || [],
    isLoading: query.isLoading,
    addComment: addMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,
    currentUserId: user?.id,
  };
}
