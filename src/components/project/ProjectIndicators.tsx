import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Target, TrendingUp, Activity, BarChart3, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '@/lib/types';

export interface Indicator {
  id: string;
  type: 'impact' | 'resultat' | 'activite';
  name: string;
  description: string;
  unit: string;
  baseline: number;
  target: number;
  current: number;
  source: string;
  frequency: string;
  periods: { label: string; value: number }[];
}

interface Props {
  project: Project;
  onSave: (partial: Partial<Project>) => void;
  readOnly: boolean;
}

const TYPE_CONFIG = {
  impact: { label: 'Impact', icon: Target, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  resultat: { label: 'Résultat', icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  activite: { label: 'Activité', icon: Activity, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

const FREQUENCIES = ['Mensuelle', 'Trimestrielle', 'Semestrielle', 'Annuelle'];

function generateId() {
  return 'ind-' + Math.random().toString(36).slice(2, 10);
}

function getProgress(current: number, baseline: number, target: number): number {
  if (target === baseline) return current >= target ? 100 : 0;
  return Math.min(100, Math.max(0, ((current - baseline) / (target - baseline)) * 100));
}

export default function ProjectIndicators({ project, onSave, readOnly }: Props) {
  const indicators: Indicator[] = (project as any).indicators || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState<Partial<Indicator>>({
    type: 'resultat', name: '', description: '', unit: '', baseline: 0, target: 0, current: 0, source: '', frequency: 'Trimestrielle', periods: [],
  });

  const save = useCallback((list: Indicator[]) => {
    onSave({ indicators: list } as any);
  }, [onSave]);

  const handleAdd = () => {
    if (!form.name?.trim()) { toast.error('Le nom est requis'); return; }
    const newInd: Indicator = {
      id: generateId(),
      type: form.type as Indicator['type'],
      name: form.name!,
      description: form.description || '',
      unit: form.unit || '',
      baseline: form.baseline || 0,
      target: form.target || 0,
      current: form.current || 0,
      source: form.source || '',
      frequency: form.frequency || 'Trimestrielle',
      periods: [],
    };
    save([...indicators, newInd]);
    setShowAdd(false);
    setForm({ type: 'resultat', name: '', description: '', unit: '', baseline: 0, target: 0, current: 0, source: '', frequency: 'Trimestrielle', periods: [] });
    toast.success('Indicateur ajouté');
  };

  const handleDelete = (id: string) => {
    save(indicators.filter(i => i.id !== id));
    toast.success('Indicateur supprimé');
  };

  const handleUpdateCurrent = (id: string, value: number) => {
    save(indicators.map(i => i.id === id ? { ...i, current: value } : i));
    setEditingId(null);
    toast.success('Valeur mise à jour');
  };

  const impactInds = indicators.filter(i => i.type === 'impact');
  const resultatInds = indicators.filter(i => i.type === 'resultat');
  const activiteInds = indicators.filter(i => i.type === 'activite');

  const overallProgress = indicators.length > 0
    ? indicators.reduce((s, i) => s + getProgress(i.current, i.baseline, i.target), 0) / indicators.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><BarChart3 className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{indicators.length}</p>
                <p className="text-xs text-muted-foreground">Indicateurs total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {(['impact', 'resultat', 'activite'] as const).map(type => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          const count = indicators.filter(i => i.type === type).length;
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${cfg.bg}`}><Icon className={`w-5 h-5 ${cfg.color}`} /></div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-sm font-bold">{overallProgress.toFixed(0)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Add Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAdd(!showAdd)} variant={showAdd ? 'outline' : 'default'} size="sm">
            {showAdd ? <><X className="w-4 h-4 mr-1" /> Annuler</> : <><Plus className="w-4 h-4 mr-1" /> Ajouter un indicateur</>}
          </Button>
        </div>
      )}

      {/* Add Form */}
      {showAdd && !readOnly && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3"><CardTitle className="text-base">Nouvel indicateur</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impact">🎯 Impact</SelectItem>
                    <SelectItem value="resultat">📈 Résultat</SelectItem>
                    <SelectItem value="activite">⚡ Activité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom de l'indicateur *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Nombre de bénéficiaires formés" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description détaillée de l'indicateur..." rows={2} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Unité</label>
                <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Personnes" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Référence (baseline)</label>
                <Input type="number" value={form.baseline} onChange={e => setForm({ ...form, baseline: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Cible</label>
                <Input type="number" value={form.target} onChange={e => setForm({ ...form, target: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Valeur actuelle</label>
                <Input type="number" value={form.current} onChange={e => setForm({ ...form, current: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Fréquence</label>
                <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Source de vérification</label>
              <Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Ex: Registres de formation, rapports terrain" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAdd} size="sm"><Check className="w-4 h-4 mr-1" /> Enregistrer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicators by type */}
      {[
        { type: 'impact' as const, items: impactInds },
        { type: 'resultat' as const, items: resultatInds },
        { type: 'activite' as const, items: activiteInds },
      ].filter(g => g.items.length > 0).map(group => {
        const cfg = TYPE_CONFIG[group.type];
        const Icon = cfg.icon;
        return (
          <Card key={group.type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className={`w-5 h-5 ${cfg.color}`} />
                Indicateurs d'{cfg.label.toLowerCase()}
                <Badge className={`${cfg.badge} ml-2`}>{group.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map(ind => {
                const progress = getProgress(ind.current, ind.baseline, ind.target);
                const isEditing = editingId === ind.id;
                return (
                  <div key={ind.id} className={`rounded-lg border p-4 ${cfg.bg}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{ind.name}</h4>
                        {ind.description && <p className="text-xs text-muted-foreground mt-0.5">{ind.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {!readOnly && !isEditing && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(ind.id)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!readOnly && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(ind.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                      <div><span className="text-muted-foreground">Référence:</span> <span className="font-medium">{ind.baseline} {ind.unit}</span></div>
                      <div><span className="text-muted-foreground">Cible:</span> <span className="font-medium">{ind.target} {ind.unit}</span></div>
                      <div>
                        <span className="text-muted-foreground">Actuel:</span>{' '}
                        {isEditing ? (
                          <span className="inline-flex items-center gap-1">
                            <Input
                              type="number"
                              defaultValue={ind.current}
                              className="h-6 w-20 text-xs"
                              onKeyDown={e => { if (e.key === 'Enter') handleUpdateCurrent(ind.id, Number((e.target as HTMLInputElement).value)); }}
                              autoFocus
                            />
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                          </span>
                        ) : (
                          <span className="font-medium">{ind.current} {ind.unit}</span>
                        )}
                      </div>
                      <div><span className="text-muted-foreground">Source:</span> <span className="font-medium">{ind.source || '—'}</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className={`text-xs font-bold ${progress >= 100 ? 'text-emerald-600' : progress >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {indicators.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Aucun indicateur défini pour ce projet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Ajoutez des indicateurs d'impact, de résultat et d'activité pour suivre la performance programmatique.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
