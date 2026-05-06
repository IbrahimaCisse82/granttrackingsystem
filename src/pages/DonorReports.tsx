import { useMemo, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useDonorTemplates, useDonorRuns, type DonorTemplateSection } from '@/hooks/useDonorReports';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, FileDown, Sparkles } from 'lucide-react';
import { calcBudgetTotal, calcDepensesTotal, fmt } from '@/lib/utils-project';
import { toast } from 'sonner';

const SECTION_TYPES: { value: DonorTemplateSection['type']; label: string }[] = [
  { value: 'narrative', label: 'Narratif' },
  { value: 'budget', label: 'Budget' },
  { value: 'expenses', label: 'Dépenses' },
  { value: 'comparison', label: 'Comparatif prévu / réalisé' },
  { value: 'indicators', label: 'Indicateurs' },
  { value: 'vouchers', label: 'Fiches de versement' },
];

export default function DonorReports() {
  const { activeOrg, orgRole } = useOrganization();
  const { templates, upsert, remove } = useDonorTemplates(activeOrg?.id);
  const { runs, generate } = useDonorRuns(activeOrg?.id);
  const { projects } = useProjects();
  const canEdit = orgRole === 'owner' || orgRole === 'admin' || orgRole === 'manager';

  const [name, setName] = useState('');
  const [donor, setDonor] = useState('');
  const [periodicity, setPeriodicity] = useState('quarterly');
  const [currency, setCurrency] = useState('EUR');
  const [sections, setSections] = useState<DonorTemplateSection[]>([
    { key: 'intro', title: 'Résumé exécutif', type: 'narrative' },
    { key: 'cmp', title: 'Comparatif prévu / réalisé', type: 'comparison' },
  ]);

  const [genProject, setGenProject] = useState('');
  const [genTemplate, setGenTemplate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const submitTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate({ name, donor_name: donor, periodicity: periodicity as never, currency, sections });
    setName(''); setDonor('');
  };

  const addSection = () =>
    setSections(s => [...s, { key: `s${s.length}`, title: 'Section', type: 'narrative' }]);

  const project = useMemo(() => projects.find(p => p.id === genProject), [projects, genProject]);

  const runGenerate = () => {
    if (!project || !activeOrg || !genTemplate) {
      toast.error('Sélectionnez un projet et un modèle');
      return;
    }
    const tpl = templates.find(t => t.id === genTemplate);
    const budget = calcBudgetTotal(project);
    const expenses = calcDepensesTotal(project);
    const payload = {
      template: tpl?.name,
      donor: tpl?.donor_name,
      project: { title: project.title, org: project.org, currency: project.devise },
      summary: {
        budget_total: budget,
        expenses_total: expenses,
        execution_rate: budget > 0 ? +(expenses / budget * 100).toFixed(2) : 0,
      },
      bailleurs: project.bailleurs,
    };
    generate.mutate({
      organization_id: activeOrg.id,
      project_id: project.id,
      template_id: genTemplate,
      period_start: start,
      period_end: end,
      payload,
      status: 'draft',
    });
  };

  const downloadJson = (run: typeof runs[number]) => {
    const blob = new Blob([JSON.stringify(run.payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-bailleur-${run.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Reporting bailleur</h1>
        <p className="text-xs text-muted-foreground mt-1">Modèles personnalisables et génération multi-périodes</p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="generate">Générer un rapport</TabsTrigger>
          <TabsTrigger value="runs">Rapports générés ({runs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 pt-4">
          {canEdit && (
            <form onSubmit={submitTemplate} className="rounded-lg border bg-card p-5 space-y-4">
              <h3 className="text-sm font-semibold">Nouveau modèle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nom du modèle</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Rapport trimestriel Enabel" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bailleur</Label>
                  <Input value={donor} onChange={e => setDonor(e.target.value)} placeholder="Enabel" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Périodicité</Label>
                  <Select value={periodicity} onValueChange={setPeriodicity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="quarterly">Trimestrielle</SelectItem>
                      <SelectItem value="semestrial">Semestrielle</SelectItem>
                      <SelectItem value="annual">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Devise</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['EUR', 'XOF', 'USD', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Sections du rapport</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addSection} className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Ajouter
                  </Button>
                </div>
                {sections.map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-6 h-8 text-xs" value={s.title}
                      onChange={e => setSections(arr => arr.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                    <Select value={s.type} onValueChange={v => setSections(arr => arr.map((x, j) => j === i ? { ...x, type: v as never } : x))}>
                      <SelectTrigger className="col-span-5 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{SECTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <button type="button" className="col-span-1 text-destructive hover:opacity-70"
                      onClick={() => setSections(arr => arr.filter((_, j) => j !== i))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <Button type="submit" size="sm" disabled={upsert.isPending}>Enregistrer le modèle</Button>
            </form>
          )}

          <div className="rounded-lg border bg-card divide-y">
            {templates.length === 0 ? (
              <p className="p-6 text-xs text-muted-foreground italic text-center">Aucun modèle.</p>
            ) : templates.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.donor_name} · {t.periodicity} · {t.currency} · {t.sections.length} sections</div>
                </div>
                {canEdit && (
                  <button onClick={() => remove.mutate(t.id)} className="text-destructive hover:opacity-70">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generate" className="pt-4">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Générer un rapport</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Projet</Label>
                <Select value={genProject} onValueChange={setGenProject}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title || p.org}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Modèle</Label>
                <Select value={genTemplate} onValueChange={setGenTemplate}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Début de période</Label>
                <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fin de période</Label>
                <Input type="date" value={end} onChange={e => setEnd(e.target.value)} />
              </div>
            </div>
            <Button onClick={runGenerate} disabled={!canEdit || generate.isPending} size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-2" /> Générer
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="runs" className="pt-4">
          <div className="rounded-lg border bg-card divide-y">
            {runs.length === 0 ? (
              <p className="p-6 text-xs text-muted-foreground italic text-center">Aucun rapport généré.</p>
            ) : runs.map(r => {
              const summary = (r.payload as { summary?: { execution_rate?: number; budget_total?: number; expenses_total?: number } }).summary;
              return (
                <div key={r.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {(r.payload as { template?: string }).template || 'Rapport'} — {(r.payload as { donor?: string }).donor}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.period_start} → {r.period_end}
                      {summary && ` · Exécution ${summary.execution_rate}% · ${fmt(summary.expenses_total || 0)} / ${fmt(summary.budget_total || 0)}`}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadJson(r)}>
                    <FileDown className="w-3.5 h-3.5 mr-1.5" /> JSON
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
