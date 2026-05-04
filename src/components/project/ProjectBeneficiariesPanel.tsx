import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '@/lib/types';

interface Props { project: Project; }

interface OrgUser { user_id: string; first_name: string; last_name: string; }

export default function ProjectBeneficiariesPanel({ project }: Props) {
  const { user, role } = useAuth();
  const { activeOrg } = useOrganization();
  const qc = useQueryClient();
  const [selected, setSelected] = useState('');
  const isAdmin = role === 'admin';

  const assignments = useQuery({
    queryKey: ['project-beneficiaries', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_beneficiaries')
        .select('id, beneficiary_id, created_at')
        .eq('project_id', project.id);
      if (error) throw error;
      return data || [];
    },
  });

  const orgUsers = useQuery({
    queryKey: ['org-beneficiaries', activeOrg?.id],
    queryFn: async (): Promise<OrgUser[]> => {
      if (!activeOrg) return [];
      const { data: members } = await supabase.from('organization_members').select('user_id').eq('organization_id', activeOrg.id);
      const ids = (members || []).map(m => m.user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', ids);
      return (profiles || []) as OrgUser[];
    },
    enabled: !!activeOrg && isAdmin,
  });

  const add = useMutation({
    mutationFn: async (beneficiary_id: string) => {
      if (!user || !activeOrg) throw new Error('Contexte indisponible');
      const { error } = await supabase.from('project_beneficiaries').insert({
        project_id: project.id,
        organization_id: activeOrg.id,
        beneficiary_id,
        assigned_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Bénéficiaire assigné'); setSelected(''); qc.invalidateQueries({ queryKey: ['project-beneficiaries'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_beneficiaries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Assignation retirée'); qc.invalidateQueries({ queryKey: ['project-beneficiaries'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  const userName = (id: string) => {
    const u = orgUsers.data?.find(o => o.user_id === id);
    return u ? `${u.first_name} ${u.last_name}`.trim() || id.slice(0, 8) : id.slice(0, 8);
  };

  const assignedIds = new Set((assignments.data || []).map(a => a.beneficiary_id));
  const candidates = (orgUsers.data || []).filter(u => !assignedIds.has(u.user_id) && u.user_id !== user?.id);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Bénéficiaires assignés</h3>
      <div className="flex gap-2">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Sélectionner un membre…" /></SelectTrigger>
          <SelectContent>
            {candidates.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.first_name} {u.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" disabled={!selected || add.isPending} onClick={() => selected && add.mutate(selected)} className="gap-1.5">
          <UserPlus className="w-4 h-4" /> Assigner
        </Button>
      </div>
      <ul className="space-y-1.5">
        {(assignments.data || []).length === 0 && <li className="text-xs text-muted-foreground italic">Aucun bénéficiaire assigné.</li>}
        {(assignments.data || []).map(a => (
          <li key={a.id} className="flex items-center justify-between text-sm border rounded px-3 py-1.5">
            <span>{userName(a.beneficiary_id)}</span>
            <button onClick={() => remove.mutate(a.id)} className="text-destructive hover:opacity-70"><Trash2 className="w-3.5 h-3.5" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
