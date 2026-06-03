import { useState, forwardRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '@/lib/types';
import { createEmptyReport, getReportCount } from '@/lib/utils-project';
import { projectCreateSchema, formatZodError } from '@/lib/schemas';

const COLORS = [
  { stripe: '#005B99', badge: 'b-blue' },
  { stripe: '#0D9488', badge: 'b-teal' },
  { stripe: '#B45309', badge: 'b-amber' },
  { stripe: '#5B21B6', badge: 'b-violet' },
  { stripe: '#9F1239', badge: 'b-rose' },
  { stripe: '#065F46', badge: 'b-emerald' },
];

const RISK_OPTIONS = ['Faible risque', 'Risque modéré', 'Risque important', 'Risque élevé'];
const PERIODICITE_OPTIONS = ['Mensuelle', 'Trimestrielle', 'Semestrielle', 'Annuelle'];

const initialForm = {
  convention: '',
  org: '',
  orgType: '',
  title: '',
  pays: '',
  devise: 'FCFA',
  currency: 'XOF',
  taux: 655.957,
  risque: '',
  debut: '',
  fin: '',
  periodicite: '',
};

export default function CreateProjectDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const { addProject, isAdding } = useProjects();

  const set = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = projectCreateSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    const data = parsed.data;

    const colorIndex = Math.floor(Math.random() * COLORS.length);
    const reportCount = getReportCount(data.periodicite || '');
    const reports = Array.from({ length: reportCount }, () => createEmptyReport());

    const project: Omit<Project, 'id' | 'createdAt'> = {
      ...data,
      orgType: data.orgType ?? '',
      pays: data.pays ?? '',
      risque: data.risque ?? '',
      debut: data.debut ?? '',
      fin: data.fin ?? '',
      periodicite: data.periodicite ?? '',
      taux: Number(data.taux),
      color: COLORS[colorIndex],
      budgetLines: [],
      reports,
      fiches: { versements: [] },
      amendements: [],
      infos: { submitDate: '', preparedBy: '', version: '', scoreRisque: '' },
    };

    await addProject(project);
    setForm(initialForm);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouveau projet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="convention">N° Convention *</Label>
            <Input id="convention" placeholder="Ex: CONV-2024-001" value={form.convention} onChange={e => set('convention', e.target.value)} required maxLength={50} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org">Organisation *</Label>
              <Input id="org" placeholder="Nom de l'organisation" value={form.org} onChange={e => set('org', e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orgType">Type d'organisation</Label>
              <Input id="orgType" placeholder="ONG, Association…" value={form.orgType} onChange={e => set('orgType', e.target.value)} maxLength={50} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre du projet *</Label>
            <Input id="title" placeholder="Intitulé du projet" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pays">Pays</Label>
            <Input id="pays" placeholder="Ex: Sénégal" value={form.pays} onChange={e => set('pays', e.target.value)} maxLength={50} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="devise">Devise</Label>
              <Select value={form.devise} onValueChange={v => set('devise', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FCFA">FCFA</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taux">Taux de change (→ EUR)</Label>
              <Input id="taux" type="number" step="0.001" min="0" value={form.taux} onChange={e => set('taux', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="debut">Date de début</Label>
              <Input id="debut" type="date" value={form.debut} onChange={e => set('debut', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fin">Date de fin</Label>
              <Input id="fin" type="date" value={form.fin} onChange={e => set('fin', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Niveau de risque</Label>
              <Select value={form.risque} onValueChange={v => set('risque', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {RISK_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Périodicité des rapports</Label>
              <Select value={form.periodicite} onValueChange={v => set('periodicite', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {PERIODICITE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? 'Création…' : 'Créer le projet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
