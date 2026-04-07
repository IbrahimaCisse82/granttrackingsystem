import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, History } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  create: '🆕 Création',
  update: '✏️ Modification',
  delete: '🗑️ Suppression',
  archive: '📦 Archivage',
  unarchive: '📂 Désarchivage',
  submit_report: '📄 Soumission rapport',
  submit_amendement: '📝 Soumission amendement',
  approve_amendement: '✅ Approbation amendement',
};

export default function AuditPage() {
  const { user } = useAuth();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Historique des modifications</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Journal d'audit de toutes les actions effectuées sur les projets</p>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-rule py-16 text-center">
          <History className="w-10 h-10 text-dim mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Aucune activité</p>
          <p className="text-xs text-muted-foreground">Les actions apparaîtront ici au fur et à mesure</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-ink-2">
                {['Date', 'Action', 'Détails', 'Projet'].map(h => (
                  <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logs as any[]).map((log: any) => (
                <tr key={log.id} className="border-b border-rule-2 hover:bg-paper transition-colors">
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-foreground/80 max-w-[300px] truncate">
                    {log.details?.description || log.details?.tab || '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {log.project_id ? log.project_id.slice(0, 8) + '…' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
