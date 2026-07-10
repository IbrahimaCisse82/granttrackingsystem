import { useState, useMemo } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useDonorEligibility, DonorEligibilityRule, DonorDocument, DonorRuleType, DonorDocPhase } from '@/hooks/useDonorEligibility';
import { Plus, Trash2, ShieldCheck, ShieldAlert, ShieldX, FileText, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

const RULE_META: Record<DonorRuleType, { label: string; color: string; icon: React.ReactNode }> = {
  allowed: { label: 'Autorisée', color: '#059669', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  capped: { label: 'Plafonnée', color: '#B45309', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  forbidden: { label: 'Interdite', color: '#DC2626', icon: <ShieldX className="w-3.5 h-3.5" /> },
};

const PHASE_LABELS: Record<DonorDocPhase, string> = {
  contract: 'Contrat',
  reporting: 'Reporting',
  closure: 'Clôture',
};

export default function DonorEligibilityMatrix() {
  const { activeOrg, orgRole } = useOrganization();
  const isAdmin = orgRole === 'owner' || orgRole === 'admin';
  const { rules, documents, isLoading, upsertRule, deleteRule, upsertDoc, deleteDoc } = useDonorEligibility(activeOrg?.id);

  const [tab, setTab] = useState<'rules' | 'docs'>('rules');
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<Partial<DonorEligibilityRule>>({ rule_type: 'allowed' });
  const [docDraft, setDocDraft] = useState<Partial<DonorDocument>>({ mandatory: true, phase: 'reporting' });

  const donors = useMemo(() => {
    const s = new Set<string>();
    rules.forEach(r => s.add(r.donor_name));
    documents.forEach(d => s.add(d.donor_name));
    return Array.from(s).sort();
  }, [rules, documents]);

  const submitRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !ruleDraft.donor_name || !ruleDraft.category) return;
    await upsertRule.mutateAsync({
      organization_id: activeOrg.id,
      donor_name: ruleDraft.donor_name!,
      category: ruleDraft.category!,
      rule_type: (ruleDraft.rule_type || 'allowed') as DonorRuleType,
      cap_pct: ruleDraft.cap_pct ?? null,
      cap_amount: ruleDraft.cap_amount ?? null,
      notes: ruleDraft.notes || '',
      id: ruleDraft.id,
    } as any);
    setRuleDraft({ rule_type: 'allowed' });
    setShowRuleForm(false);
  };

  const submitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !docDraft.donor_name || !docDraft.doc_key || !docDraft.doc_label) return;
    await upsertDoc.mutateAsync({
      organization_id: activeOrg.id,
      donor_name: docDraft.donor_name!,
      doc_key: docDraft.doc_key!,
      doc_label: docDraft.doc_label!,
      mandatory: docDraft.mandatory ?? true,
      phase: (docDraft.phase || 'reporting') as DonorDocPhase,
      notes: docDraft.notes || '',
      id: docDraft.id,
    } as any);
    setDocDraft({ mandatory: true, phase: 'reporting' });
    setShowDocForm(false);
  };

  const exportCsv = () => {
    if (tab === 'rules') {
      const rows = [['donor', 'category', 'rule_type', 'cap_pct', 'cap_amount', 'notes']];
      rules.forEach(r => rows.push([r.donor_name, r.category, r.rule_type, String(r.cap_pct ?? ''), String(r.cap_amount ?? ''), r.notes || '']));
      downloadCsv(rows, 'regles-eligibilite.csv');
    } else {
      const rows = [['donor', 'doc_key', 'doc_label', 'mandatory', 'phase', 'notes']];
      documents.forEach(d => rows.push([d.donor_name, d.doc_key, d.doc_label, String(d.mandatory), d.phase, d.notes || '']));
      downloadCsv(rows, 'checklist-documents.csv');
    }
    toast.success('Export CSV téléchargé');
  };

  return (
    <div className="mt-6 rounded-[10px] border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Matrice d'éligibilité par bailleur</span>
          {donors.length > 0 && <span className="text-xs text-muted-foreground">· {donors.length} bailleur(s)</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setTab('rules')}
              className={`px-3 py-1.5 text-xs font-medium ${tab === 'rules' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}>
              Règles ({rules.length})
            </button>
            <button onClick={() => setTab('docs')}
              className={`px-3 py-1.5 text-xs font-medium ${tab === 'docs' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}>
              Documents ({documents.length})
            </button>
          </div>
          <button onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-muted">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {isAdmin && (
            <button onClick={() => tab === 'rules' ? setShowRuleForm(!showRuleForm) : setShowDocForm(!showDocForm)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          )}
        </div>
      </div>

      {tab === 'rules' && showRuleForm && (
        <form onSubmit={submitRule} className="p-4 border-b border-border bg-muted/30 grid grid-cols-1 md:grid-cols-6 gap-2">
          <input required placeholder="Bailleur" value={ruleDraft.donor_name || ''} onChange={e => setRuleDraft(d => ({ ...d, donor_name: e.target.value }))}
            className="md:col-span-2 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
          <input required placeholder="Catégorie (ex. Personnel)" value={ruleDraft.category || ''} onChange={e => setRuleDraft(d => ({ ...d, category: e.target.value }))}
            className="md:col-span-2 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
          <select value={ruleDraft.rule_type} onChange={e => setRuleDraft(d => ({ ...d, rule_type: e.target.value as DonorRuleType }))}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs">
            <option value="allowed">Autorisée</option>
            <option value="capped">Plafonnée</option>
            <option value="forbidden">Interdite</option>
          </select>
          <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Enregistrer</button>
          {ruleDraft.rule_type === 'capped' && (
            <>
              <input type="number" step="0.01" placeholder="Plafond %" value={ruleDraft.cap_pct ?? ''} onChange={e => setRuleDraft(d => ({ ...d, cap_pct: e.target.value ? Number(e.target.value) : null }))}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
              <input type="number" step="0.01" placeholder="Plafond montant" value={ruleDraft.cap_amount ?? ''} onChange={e => setRuleDraft(d => ({ ...d, cap_amount: e.target.value ? Number(e.target.value) : null }))}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
            </>
          )}
          <input placeholder="Notes" value={ruleDraft.notes || ''} onChange={e => setRuleDraft(d => ({ ...d, notes: e.target.value }))}
            className="md:col-span-6 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
        </form>
      )}

      {tab === 'docs' && showDocForm && (
        <form onSubmit={submitDoc} className="p-4 border-b border-border bg-muted/30 grid grid-cols-1 md:grid-cols-6 gap-2">
          <input required placeholder="Bailleur" value={docDraft.donor_name || ''} onChange={e => setDocDraft(d => ({ ...d, donor_name: e.target.value }))}
            className="md:col-span-2 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
          <input required placeholder="Clé (ex. audit_report)" value={docDraft.doc_key || ''} onChange={e => setDocDraft(d => ({ ...d, doc_key: e.target.value }))}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
          <input required placeholder="Libellé" value={docDraft.doc_label || ''} onChange={e => setDocDraft(d => ({ ...d, doc_label: e.target.value }))}
            className="md:col-span-2 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
          <select value={docDraft.phase} onChange={e => setDocDraft(d => ({ ...d, phase: e.target.value as DonorDocPhase }))}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs">
            <option value="contract">Contrat</option>
            <option value="reporting">Reporting</option>
            <option value="closure">Clôture</option>
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={docDraft.mandatory ?? true} onChange={e => setDocDraft(d => ({ ...d, mandatory: e.target.checked }))} />
            Obligatoire
          </label>
          <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Enregistrer</button>
          <input placeholder="Notes" value={docDraft.notes || ''} onChange={e => setDocDraft(d => ({ ...d, notes: e.target.value }))}
            className="md:col-span-6 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs" />
        </form>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : tab === 'rules' ? (
        rules.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">Aucune règle d'éligibilité définie.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Bailleur</th>
                <th className="text-left px-4 py-2 font-medium">Catégorie</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-right px-4 py-2 font-medium">Plafond</th>
                <th className="text-left px-4 py-2 font-medium">Notes</th>
                {isAdmin && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {rules.map(r => {
                const m = RULE_META[r.rule_type];
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2 text-xs font-medium">{r.donor_name}</td>
                    <td className="px-4 py-2 text-xs">{r.category}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: m.color + '18', color: m.color }}>
                        {m.icon}{m.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-right font-mono">
                      {r.cap_pct != null && `${r.cap_pct}%`}
                      {r.cap_pct != null && r.cap_amount != null && ' · '}
                      {r.cap_amount != null && r.cap_amount.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[240px]">{r.notes}</td>
                    {isAdmin && (
                      <td className="px-2 py-2">
                        <button onClick={() => deleteRule.mutate(r.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      ) : (
        documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">Aucun document défini.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Bailleur</th>
                <th className="text-left px-4 py-2 font-medium">Document</th>
                <th className="text-left px-4 py-2 font-medium">Phase</th>
                <th className="text-left px-4 py-2 font-medium">Obligatoire</th>
                <th className="text-left px-4 py-2 font-medium">Notes</th>
                {isAdmin && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {documents.map(d => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2 text-xs font-medium">{d.donor_name}</td>
                  <td className="px-4 py-2 text-xs">
                    <div className="font-medium">{d.doc_label}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{d.doc_key}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">{PHASE_LABELS[d.phase]}</td>
                  <td className="px-4 py-2 text-xs">{d.mandatory ? '✅' : '—'}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[240px]">{d.notes}</td>
                  {isAdmin && (
                    <td className="px-2 py-2">
                      <button onClick={() => deleteDoc.mutate(d.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
