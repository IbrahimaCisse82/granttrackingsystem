import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bug, Info, Skull, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

type Severity = 'info' | 'warning' | 'error' | 'fatal';

interface ClientError {
  id: string;
  user_id: string | null;
  severity: Severity;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  context: Record<string, unknown>;
  app_version: string | null;
  created_at: string;
}

const SEV_META: Record<Severity, { label: string; cls: string; icon: React.ReactNode }> = {
  info:    { label: 'Info',    cls: 'bg-sky-50 text-sky-700',       icon: <Info className="w-3.5 h-3.5" /> },
  warning: { label: 'Warning', cls: 'bg-amber-50 text-amber-700',   icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  error:   { label: 'Error',   cls: 'bg-rose-50 text-rose-700',     icon: <Bug className="w-3.5 h-3.5" /> },
  fatal:   { label: 'Fatal',   cls: 'bg-rose-100 text-rose-900',    icon: <Skull className="w-3.5 h-3.5" /> },
};

export default function AdminErrors() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['client-errors', filter],
    queryFn: async () => {
      let q = supabase.from('client_errors').select('*').order('created_at', { ascending: false }).limit(200);
      if (filter !== 'all') q = q.eq('severity', filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ClientError[];
    },
    enabled: role === 'admin',
  });

  const purge = useMutation({
    mutationFn: async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('client_errors').delete().lt('created_at', cutoff);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Erreurs > 30 jours supprimées'); qc.invalidateQueries({ queryKey: ['client-errors'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (role !== 'admin') {
    return <div className="p-8 text-sm text-muted-foreground">Accès réservé aux administrateurs.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal d'erreurs client</h1>
          <p className="text-sm text-muted-foreground mt-1">200 derniers événements capturés dans le navigateur.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ['client-errors'] })}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Actualiser
          </Button>
          <Button size="sm" variant="outline" onClick={() => purge.mutate()} disabled={purge.isPending}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Purger &gt; 30j
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all','fatal','error','warning','info'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${filter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-rule hover:bg-muted'}`}>
            {s === 'all' ? 'Tous' : SEV_META[s].label}
          </button>
        ))}
      </div>

      {list.isLoading && <div className="text-sm text-muted-foreground">Chargement…</div>}
      {list.data?.length === 0 && (
        <div className="rounded-lg border border-rule bg-card p-8 text-center text-sm text-muted-foreground">
          Aucune erreur enregistrée. 🎉
        </div>
      )}

      <div className="space-y-2">
        {list.data?.map(e => {
          const meta = SEV_META[e.severity];
          const isOpen = expanded === e.id;
          return (
            <div key={e.id} className="rounded-lg border border-rule bg-card overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : e.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/40 transition-colors">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${meta.cls}`}>
                  {meta.icon} {meta.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-foreground truncate">{e.message}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-3 flex-wrap">
                    <span>{new Date(e.created_at).toLocaleString()}</span>
                    {e.url && <span className="truncate max-w-md">{e.url}</span>}
                    {e.app_version && <span>v{e.app_version}</span>}
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-rule bg-muted/30 p-3 space-y-2 text-xs">
                  {e.stack && (
                    <div>
                      <div className="font-semibold mb-1 text-muted-foreground uppercase tracking-wider text-[10px]">Stack</div>
                      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] bg-background p-2 rounded border border-rule max-h-60 overflow-auto">{e.stack}</pre>
                    </div>
                  )}
                  {Object.keys(e.context || {}).length > 0 && (
                    <div>
                      <div className="font-semibold mb-1 text-muted-foreground uppercase tracking-wider text-[10px]">Contexte</div>
                      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] bg-background p-2 rounded border border-rule">{JSON.stringify(e.context, null, 2)}</pre>
                    </div>
                  )}
                  {e.user_agent && (
                    <div className="text-[11px] text-muted-foreground">UA : <span className="font-mono">{e.user_agent}</span></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
