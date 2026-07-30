import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectRisks, type RiskCategory, type RiskStatus, type ProjectRisk } from '@/hooks/useProjectRisks';
import { useOrganization } from '@/hooks/useOrganization';
import { Loader2, Plus, Trash2, ShieldAlert } from 'lucide-react';
import type { Project } from '@/lib/types';

const CATEGORIES: { value: RiskCategory; labelKey: string }[] = [
  { value: 'operational', labelKey: 'risks.categories.operational' },
  { value: 'financial', labelKey: 'risks.categories.financial' },
  { value: 'security', labelKey: 'risks.categories.security' },
  { value: 'reputation', labelKey: 'risks.categories.reputation' },
  { value: 'compliance', labelKey: 'risks.categories.compliance' },
  { value: 'other', labelKey: 'risks.other' },
];

const STATUSES: { value: RiskStatus; labelKey: string; cls: string }[] = [
  { value: 'open', labelKey: 'risks.statuses.open', cls: 'bg-rose/10 text-rose' },
  { value: 'mitigated', labelKey: 'risks.statusMitigated', cls: 'bg-amber/10 text-amber' },
  { value: 'closed', labelKey: 'risks.statusClosed', cls: 'bg-emerald/10 text-emerald' },
];

function scoreColor(s: number): string {
  if (s >= 15) return 'bg-rose text-white';
  if (s >= 8) return 'bg-amber text-white';
  if (s >= 4) return 'bg-teal text-white';
  return 'bg-emerald text-white';
}

interface Props { project: Project; readOnly?: boolean }

export default function ProjectRiskRegister({ project, readOnly }: Props) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';
  const { activeOrgId } = useOrganization();
  const { risks, isLoading, create, update, remove } = useProjectRisks(project.id);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Partial<ProjectRisk>>({
    category: 'operational', likelihood: 3, impact: 3, status: 'open',
  });
  const [catFilter, setCatFilter] = useState<string>('');

  const shown = catFilter ? risks.filter(r => r.category === catFilter) : risks;
  const avgOpen = (() => {
    const open = risks.filter(r => r.status === 'open');
    if (!open.length) return 0;
    return Math.round(open.reduce((s, r) => s + r.score, 0) / open.length);
  })();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-rule bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose" /> {t('risks.title')}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t('risks.subtitle')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-semibold">{avgOpen}</div>
            <div className="text-[10px] text-muted-foreground">{t('risks.avgOpen')}</div>
          </div>
        </div>
      </div>

      {/* Heatmap 5x5 */}
      <div className="rounded-[10px] border border-rule bg-card p-4">
        <h3 className="text-[12px] font-semibold mb-3">{t('risks.matrixTitle')}</h3>
        <div className="grid grid-cols-6 gap-0.5 text-[10px]">
          <div />
          {[1,2,3,4,5].map(i => <div key={i} className="text-center text-muted-foreground py-1">I{i}</div>)}
          {[5,4,3,2,1].map(p => (
            <>
              <div key={`l-${p}`} className="text-right text-muted-foreground pr-1 py-2">P{p}</div>
              {[1,2,3,4,5].map(i => {
                const s = p * i;
                const count = risks.filter(r => r.likelihood === p && r.impact === i && r.status === 'open').length;
                return (
                  <div key={`${p}-${i}`} className={`aspect-square rounded flex items-center justify-center font-mono ${scoreColor(s)} ${count === 0 ? 'opacity-25' : ''}`}>
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary">
          <option value="">{t('risks.allCategories')}</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{t(c.labelKey)}</option>)}
        </select>
        {!readOnly && (
          <button onClick={() => setShowForm(v => !v)}
            className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="w-3.5 h-3.5" /> {t('risks.new')}
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <div className="rounded-[10px] border border-primary/40 bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs">
              {t('risks.category')}
              <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as RiskCategory })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-xs">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{t(c.labelKey)}</option>)}
              </select>
            </label>
            <label className="text-xs">
              {t('risks.owner')}
              <input value={draft.owner ?? ''} onChange={e => setDraft({ ...draft, owner: e.target.value })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-xs" />
            </label>
          </div>
          <label className="text-xs block">
            {t('risks.description')}
            <textarea value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={2}
              className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-xs" />
          </label>
          <label className="text-xs block">
            {t('risks.mitigationPlan')}
            <textarea value={draft.mitigation ?? ''} onChange={e => setDraft({ ...draft, mitigation: e.target.value })} rows={2}
              className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-xs" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs">
              {t('risks.likelihoodField')}
              <input type="number" min={1} max={5} value={draft.likelihood ?? 3}
                onChange={e => setDraft({ ...draft, likelihood: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-xs font-mono" />
            </label>
            <label className="text-xs">
              {t('risks.impactField')}
              <input type="number" min={1} max={5} value={draft.impact ?? 3}
                onChange={e => setDraft({ ...draft, impact: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-xs font-mono" />
            </label>
            <label className="text-xs">
              {t('risks.reviewOn')}
              <input type="date" value={draft.review_date ?? ''}
                onChange={e => setDraft({ ...draft, review_date: e.target.value || null })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-xs" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded border border-input px-3 py-1.5 text-xs">{t('common.cancel')}</button>
            <button
              disabled={!draft.description || !activeOrgId}
              onClick={async () => {
                await create.mutateAsync({ ...draft, organization_id: activeOrgId! });
                setShowForm(false);
                setDraft({ category: 'operational', likelihood: 3, impact: 3, status: 'open' });
              }}
              className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-[10px] border border-rule bg-card overflow-x-auto">
        {shown.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground italic">{t('risks.empty')}</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-rule text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 px-3 font-semibold">{t('risks.category')}</th>
                <th className="py-2 px-3 font-semibold">{t('risks.description')}</th>
                <th className="py-2 px-3 font-semibold text-center">P</th>
                <th className="py-2 px-3 font-semibold text-center">I</th>
                <th className="py-2 px-3 font-semibold text-center">{t('risks.score')}</th>
                <th className="py-2 px-3 font-semibold">{t('risks.mitigation')}</th>
                <th className="py-2 px-3 font-semibold">{t('risks.owner')}</th>
                <th className="py-2 px-3 font-semibold">{t('risks.status')}</th>
                <th className="py-2 px-3 font-semibold">{t('risks.reviewDate')}</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.id} className="border-b border-rule/50 align-top">
                  <td className="py-2 px-3">{t(CATEGORIES.find(c => c.value === r.category)?.labelKey ?? 'risks.other')}</td>
                  <td className="py-2 px-3 max-w-[240px]">{r.description}</td>
                  <td className="py-2 px-3 text-center font-mono">{r.likelihood}</td>
                  <td className="py-2 px-3 text-center font-mono">{r.impact}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block rounded px-2 py-0.5 font-mono text-[11px] ${scoreColor(r.score)}`}>{r.score}</span>
                  </td>
                  <td className="py-2 px-3 max-w-[220px] text-muted-foreground">{r.mitigation || '—'}</td>
                  <td className="py-2 px-3">{r.owner || '—'}</td>
                  <td className="py-2 px-3">
                    <select
                      disabled={readOnly}
                      value={r.status}
                      onChange={e => update.mutate({ id: r.id, status: e.target.value as RiskStatus })}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium border-0 ${STATUSES.find(s => s.value === r.status)?.cls}`}
                    >
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{t(s.labelKey)}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-3 text-[11px]">{r.review_date ? new Date(r.review_date).toLocaleDateString(lng) : '—'}</td>
                  <td className="py-2 px-3">
                    {!readOnly && (
                      <button onClick={() => confirm(t('risks.confirmDelete')) && remove.mutate(r.id)}
                        className="text-rose hover:opacity-70">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
