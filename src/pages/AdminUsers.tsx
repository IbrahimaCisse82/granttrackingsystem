import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Users, Shield, Eye, Briefcase, UserCheck, ChevronDown, Plus, X, Trash2, Ban, CheckCircle, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Database } from '@/integrations/supabase/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  user_id: string;
  first_name: string;
  last_name: string;
  organization: string;
  phone: string;
  role: AppRole;
  created_at: string;
}

const ROLE_CONFIG: Record<AppRole, { labelKey: string; icon: React.ReactNode; color: string }> = {
  admin: { labelKey: 'users.roleAdmin', icon: <Shield className="w-3.5 h-3.5" />, color: 'hsl(var(--destructive))' },
  manager: { labelKey: 'users.roleManager', icon: <Briefcase className="w-3.5 h-3.5" />, color: 'hsl(var(--enabel))' },
  lecteur: { labelKey: 'users.roleLecteur', icon: <Eye className="w-3.5 h-3.5" />, color: 'hsl(var(--teal))' },
  beneficiaire: { labelKey: 'users.roleBeneficiaire', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hsl(var(--amber))' },
};

export default function AdminUsers() {
  const { t } = useTranslation();
  const { role: currentRole, user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '', password: '', first_name: '', last_name: '', role: 'beneficiaire' as AppRole,
  });
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'delete' | 'disable' | 'enable'; userId: string; userName: string }>({
    open: false, action: 'delete', userId: '', userName: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = currentRole === 'admin';

  useEffect(() => { fetchUsers(); }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setActionMenuId(null); setEditingUserId(null); };
    if (actionMenuId || editingUserId) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [actionMenuId, editingUserId]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    const { data: roles, error: rErr } = await supabase.from('user_roles').select('*');
    if (pErr || rErr) {
      toast({ title: t('users.error'), description: t('users.loadError'), variant: 'destructive' });
      setLoading(false);
      return;
    }
    const merged: UserWithRole[] = (profiles ?? []).map(p => {
      const userRole = roles?.find(r => r.user_id === p.user_id);
      return {
        user_id: p.user_id, first_name: p.first_name, last_name: p.last_name,
        organization: p.organization, phone: p.phone,
        role: (userRole?.role ?? 'beneficiaire') as AppRole, created_at: p.created_at,
      };
    });
    setUsers(merged);
    setLoading(false);
  };

  const changeRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
    if (error) {
      toast({ title: t('users.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('users.roleUpdated') });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
    }
    setEditingUserId(null);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('invite-user', {
        body: inviteForm,
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || t('users.unknownError'));
      }
      toast({ title: t('users.created'), description: t('users.createdDesc', { email: inviteForm.email, role: t(ROLE_CONFIG[inviteForm.role].labelKey) }) });
      setShowInvite(false);
      setInviteForm({ email: '', password: '', first_name: '', last_name: '', role: 'beneficiaire' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: t('users.error'), description: err.message, variant: 'destructive' });
    }
    setInviteLoading(false);
  };

  const handleUserAction = async () => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('manage-user', {
        body: { action: confirmDialog.action, user_id: confirmDialog.userId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || t('users.unknownError'));
      }
      const messages = {
        delete: t('users.deleted'),
        disable: t('users.disabled'),
        enable: t('users.enabled'),
      };
      toast({ title: messages[confirmDialog.action] });
      if (confirmDialog.action === 'delete') {
        setUsers(prev => prev.filter(u => u.user_id !== confirmDialog.userId));
      } else {
        fetchUsers();
      }
    } catch (err: any) {
      toast({ title: t('users.error'), description: err.message, variant: 'destructive' });
    }
    setActionLoading(false);
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">{t('users.restrictedTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('users.restrictedBody')}</p>
      </div>
    );
  }

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{t('users.title')}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t('users.subtitle')}</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-colors">
          <Plus className="w-4 h-4" /> {t('users.addUser')}
        </button>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">{t('users.newUser')}</h2>
              <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">{t('users.firstName')}</label>
                  <input type="text" required value={inviteForm.first_name}
                    onChange={e => setInviteForm(f => ({ ...f, first_name: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">{t('users.lastName')}</label>
                  <input type="text" required value={inviteForm.last_name}
                    onChange={e => setInviteForm(f => ({ ...f, last_name: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t('users.email')}</label>
                <input type="email" required value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t('users.initialPassword')}</label>
                <input type="password" required minLength={6} value={inviteForm.password}
                  onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">{t('users.role')}</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as AppRole }))}
                  className={inputClass}>
                  {(Object.keys(ROLE_CONFIG) as AppRole[]).map(r => (
                    <option key={r} value={r}>{t(ROLE_CONFIG[r].labelKey)}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={inviteLoading}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-colors disabled:opacity-50">
                {inviteLoading ? t('users.creating') : t('users.createAccount')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(`users.${confirmDialog.action}Title`)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(`users.${confirmDialog.action}Body`, { name: confirmDialog.userName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>{t('users.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUserAction}
              disabled={actionLoading}
              className={confirmDialog.action === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {actionLoading ? t('users.pending') : t(`users.${confirmDialog.action}`)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {(Object.keys(ROLE_CONFIG) as AppRole[]).map(role => {
          const config = ROLE_CONFIG[role];
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="rounded-[10px] border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-md p-1.5" style={{ background: config.color + '18', color: config.color }}>{config.icon}</div>
                <span className="text-xs font-medium text-muted-foreground">{t(config.labelKey)}</span>
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
          <span className="text-sm font-semibold text-foreground">{t('users.count', { count: users.length })}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{t('users.loading')}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{t('users.empty')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">{t('users.colUser')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('users.colOrg')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('users.colPhone')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('users.colRole')}</th>
                <th className="text-left px-4 py-2.5 font-medium">{t('users.colDate')}</th>
                <th className="text-right px-4 py-2.5 font-medium">{t('users.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const config = ROLE_CONFIG[u.role];
                const isSelf = u.user_id === user?.id;
                return (
                  <tr key={u.user_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {u.first_name?.[0]?.toUpperCase() || '?'}{u.last_name?.[0]?.toUpperCase() || ''}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {u.first_name} {u.last_name}
                            {isSelf && <span className="ml-1.5 text-[10px] text-muted-foreground">{t('users.you')}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.organization || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {editingUserId === u.user_id ? (
                        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                          {(Object.keys(ROLE_CONFIG) as AppRole[]).map(r => (
                            <button key={r} onClick={() => changeRole(u.user_id, r)}
                              className={`text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors ${r === u.role ? 'font-bold bg-muted' : ''}`}>
                              {t(ROLE_CONFIG[r].labelKey)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setEditingUserId(u.user_id); }}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
                          style={{ background: config.color + '15', color: config.color }}>
                          {config.icon} {t(config.labelKey)} <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === u.user_id ? null : u.user_id); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {actionMenuId === u.user_id && (
                            <div
                              className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-card shadow-lg py-1"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  setConfirmDialog({ open: true, action: 'disable', userId: u.user_id, userName: `${u.first_name} ${u.last_name}` });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5 text-amber-500" /> {t('users.disable')}
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  setConfirmDialog({ open: true, action: 'enable', userId: u.user_id, userName: `${u.first_name} ${u.last_name}` });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {t('users.enable')}
                              </button>
                              <div className="border-t border-border my-1" />
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  setConfirmDialog({ open: true, action: 'delete', userId: u.user_id, userName: `${u.first_name} ${u.last_name}` });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> {t('users.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
