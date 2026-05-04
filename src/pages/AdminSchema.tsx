import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database, Lock, ArrowRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Col { name: string; type: string; nullable: boolean; }
interface Tbl { name: string; columns: Col[]; rls: boolean; }

const KNOWN_TABLES = [
  'organizations','organization_members','profiles','user_roles',
  'projects','periodic_reports','payment_vouchers','approval_workflows',
  'exchange_rates','field_reports','project_beneficiaries',
  'audit_logs','notifications','comments',
];

export default function AdminSchema() {
  const { role, loading } = useAuth();
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    (async () => {
      const result: Record<string, number | null> = {};
      for (const t of KNOWN_TABLES) {
        const { count } = await supabase.from(t as any).select('*', { count: 'exact', head: true });
        result[t] = count ?? null;
      }
      setCounts(result);
    })();
  }, []);

  if (loading) return null;
  if (role !== 'admin') return <Navigate to="/" replace />;

  const groups: { title: string; color: string; tables: string[] }[] = [
    { title: 'Identité & Tenants', color: 'bg-blue-50 border-blue-200', tables: ['organizations','organization_members','profiles','user_roles'] },
    { title: 'Cycle Projet', color: 'bg-violet-50 border-violet-200', tables: ['projects','periodic_reports','payment_vouchers','approval_workflows','exchange_rates'] },
    { title: 'Bénéficiaires', color: 'bg-emerald-50 border-emerald-200', tables: ['field_reports','project_beneficiaries'] },
    { title: 'Observabilité', color: 'bg-amber-50 border-amber-200', tables: ['audit_logs','notifications','comments'] },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" /> Schéma de la base
        </h1>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Réservé au super admin · {KNOWN_TABLES.length} tables protégées par RLS.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {groups.map(g => (
          <div key={g.title} className={`rounded-lg border ${g.color} p-4`}>
            <h3 className="font-semibold text-sm mb-3">{g.title}</h3>
            <ul className="space-y-1.5">
              {g.tables.map(t => (
                <li key={t} className="flex items-center justify-between text-sm bg-card rounded px-3 py-1.5 border">
                  <span className="font-mono">{t}</span>
                  <span className="text-xs text-muted-foreground">{counts[t] ?? '…'} lignes</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-2">Relations principales</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 font-mono">
          <li className="flex items-center gap-2">organizations <ArrowRight className="w-3 h-3" /> organization_members <ArrowRight className="w-3 h-3" /> profiles</li>
          <li className="flex items-center gap-2">projects <ArrowRight className="w-3 h-3" /> periodic_reports <ArrowRight className="w-3 h-3" /> payment_vouchers</li>
          <li className="flex items-center gap-2">projects <ArrowRight className="w-3 h-3" /> project_beneficiaries <ArrowRight className="w-3 h-3" /> field_reports</li>
          <li className="flex items-center gap-2">approval_workflows ⟵ periodic_reports / amendements</li>
          <li className="flex items-center gap-2">audit_logs : journal de toutes les modifications sensibles</li>
        </ul>
      </div>
    </div>
  );
}
