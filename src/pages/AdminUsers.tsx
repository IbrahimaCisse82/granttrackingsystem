import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Users, Shield, Eye, Briefcase, UserCheck, ChevronDown } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  user_id: string;
  first_name: string;
  last_name: string;
  organization: string;
  phone: string;
  email: string;
  role: AppRole;
  created_at: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: 'Admin', icon: <Shield className="w-3.5 h-3.5" />, color: 'hsl(var(--destructive))' },
  manager: { label: 'Manager', icon: <Briefcase className="w-3.5 h-3.5" />, color: 'hsl(var(--enabel))' },
  lecteur: { label: 'Lecteur', icon: <Eye className="w-3.5 h-3.5" />, color: 'hsl(var(--teal))' },
  beneficiaire: { label: 'Bénéficiaire', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hsl(var(--amber))' },
};

export default function AdminUsers() {
  const { role: currentRole } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const isAdmin = currentRole === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles with their roles
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    const { data: roles, error: rErr } = await supabase.from('user_roles').select('*');

    if (pErr || rErr) {
      toast({ title: 'Erreur', description: 'Impossible de charger les utilisateurs.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const merged: UserWithRole[] = (profiles ?? []).map(p => {
      const userRole = roles?.find(r => r.user_id === p.user_id);
      return {
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        organization: p.organization,
        phone: p.phone,
        email: '', // email comes from auth, not accessible via RLS
        role: (userRole?.role ?? 'beneficiaire') as AppRole,
        created_at: p.created_at,
      };
    });
    setUsers(merged);
    setLoading(false);
  };

  const changeRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rôle mis à jour' });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
    }
    setEditingUserId(null);
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Accès restreint</h1>
        <p className="text-sm text-muted-foreground">Seuls les administrateurs peuvent accéder à cette section.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Gestion des utilisateurs</h1>
          <p className="text-xs text-muted-foreground mt-1">Gérez les accès et les rôles des membres de la plateforme</p>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {(Object.keys(ROLE_CONFIG) as AppRole[]).map(role => {
          const config = ROLE_CONFIG[role];
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="rounded-[10px] border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-md p-1.5" style={{ background: config.color + '18', color: config.color }}>
                  {config.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
              </div>
              <p className="text-2xl font-bold font-mono text-foreground">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Users table */}
      <div className="rounded-[10px] border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Utilisateurs ({users.length})</span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">Utilisateur</th>
                <th className="text-left px-4 py-2.5 font-medium">Organisation</th>
                <th className="text-left px-4 py-2.5 font-medium">Téléphone</th>
                <th className="text-left px-4 py-2.5 font-medium">Rôle</th>
                <th className="text-left px-4 py-2.5 font-medium">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const config = ROLE_CONFIG[u.role];
                return (
                  <tr key={u.user_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {u.first_name?.[0]?.toUpperCase() || '?'}{u.last_name?.[0]?.toUpperCase() || ''}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.organization || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {editingUserId === u.user_id ? (
                        <div className="flex flex-col gap-1">
                          {(Object.keys(ROLE_CONFIG) as AppRole[]).map(r => (
                            <button key={r} onClick={() => changeRole(u.user_id, r)}
                              className={`text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors ${r === u.role ? 'font-bold bg-muted' : ''}`}>
                              {ROLE_CONFIG[r].label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingUserId(u.user_id)}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
                          style={{ background: config.color + '15', color: config.color }}
                        >
                          {config.icon}
                          {config.label}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
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
