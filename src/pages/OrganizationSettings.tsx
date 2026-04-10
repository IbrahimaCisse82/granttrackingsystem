import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Crown, Shield, User, Trash2, Plus, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: { label: 'Propriétaire', icon: <Crown className="w-3.5 h-3.5" />, color: 'hsl(var(--amber))' },
  admin: { label: 'Admin', icon: <Shield className="w-3.5 h-3.5" />, color: 'hsl(var(--destructive))' },
  member: { label: 'Membre', icon: <User className="w-3.5 h-3.5" />, color: 'hsl(var(--primary))' },
};

export default function OrganizationSettings() {
  const { activeOrg, members, membersLoading, orgRole, removeMember, updateMemberRole, organizations, setActiveOrg } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('member');
  const [addLoading, setAddLoading] = useState(false);

  const isOrgAdmin = orgRole === 'owner' || orgRole === 'admin';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      // Find user by email through profiles - we need to use the invite system
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('invite-user', {
        body: { email: addEmail, organization_id: activeOrg?.id, org_role: addRole },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || 'Erreur');
      }
      const isExisting = res.data?.existing;
      toast.success(isExisting ? 'Utilisateur existant ajouté à l\'organisation' : 'Nouveau membre invité avec succès');
      // Refresh members list
      queryClient.invalidateQueries({ queryKey: ['org-members', activeOrg?.id] });
      setShowAddMember(false);
      setAddEmail('');
    } catch (err: any) {
      toast.error(err.message);
    }
    setAddLoading(false);
  };

  if (!activeOrg) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Aucune organisation sélectionnée</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Organisation</h1>
        <p className="text-xs text-muted-foreground mt-1">Gérez les paramètres et les membres de votre organisation</p>
      </div>

      {/* Org info card */}
      <div className="rounded-[10px] border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{activeOrg.name}</h2>
            <p className="text-xs text-muted-foreground font-mono">slug: {activeOrg.slug}</p>
          </div>
          {orgRole && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: ROLE_LABELS[orgRole]?.color + '15', color: ROLE_LABELS[orgRole]?.color }}>
              {ROLE_LABELS[orgRole]?.icon} {ROLE_LABELS[orgRole]?.label}
            </span>
          )}
        </div>
      </div>

      {/* Switch org */}
      {organizations.length > 1 && (
        <div className="rounded-[10px] border border-border bg-card p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Changer d'organisation</h3>
          <div className="flex flex-wrap gap-2">
            {organizations.map(org => (
              <button
                key={org.id}
                onClick={() => setActiveOrg(org.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  org.id === activeOrg.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                {org.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="rounded-[10px] border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Membres ({members.length})</span>
          </div>
          {isOrgAdmin && (
            <button onClick={() => setShowAddMember(!showAddMember)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Inviter
            </button>
          )}
        </div>

        {showAddMember && (
          <div className="p-4 border-b border-border bg-muted/30">
            <form onSubmit={handleAddMember} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                <input type="email" required value={addEmail} onChange={e => setAddEmail(e.target.value)}
                  placeholder="utilisateur@exemple.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Rôle</label>
                <select value={addRole} onChange={e => setAddRole(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={addLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {addLoading ? '…' : 'Inviter'}
              </button>
            </form>
          </div>
        )}

        {membersLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">Membre</th>
                <th className="text-left px-4 py-2.5 font-medium">Rôle</th>
                <th className="text-left px-4 py-2.5 font-medium">Depuis</th>
                {isOrgAdmin && <th className="text-right px-4 py-2.5 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const rl = ROLE_LABELS[m.role] || ROLE_LABELS.member;
                const isSelf = m.user_id === user?.id;
                return (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {m.first_name?.[0]?.toUpperCase() || '?'}{m.last_name?.[0]?.toUpperCase() || ''}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {m.first_name} {m.last_name}
                            {isSelf && <span className="ml-1.5 text-[10px] text-muted-foreground">(vous)</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isOrgAdmin && !isSelf && m.role !== 'owner' ? (
                        <select value={m.role} onChange={e => updateMemberRole(m.id, e.target.value)}
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                          <option value="member">Membre</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ background: rl.color + '15', color: rl.color }}>
                          {rl.icon} {rl.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {new Date(m.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    {isOrgAdmin && (
                      <td className="px-4 py-3 text-right">
                        {!isSelf && m.role !== 'owner' && (
                          <button onClick={() => removeMember(m.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
