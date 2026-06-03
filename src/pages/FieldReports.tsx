import { useMemo, useState } from 'react';
import { useFieldReports, type FieldReport } from '@/hooks/useFieldReports';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClipboardList, Send, CheckCircle2, Clock, FileEdit } from 'lucide-react';
import { toast } from 'sonner';
import { fieldReportSchema, formatZodError } from '@/lib/schemas';

const STATUS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', cls: 'bg-muted text-muted-foreground', icon: <FileEdit className="w-3 h-3" /> },
  submitted: { label: 'Soumis', cls: 'bg-amber-50 text-amber-700', icon: <Clock className="w-3 h-3" /> },
  reviewed: { label: 'Révisé', cls: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function FieldReports() {
  const { user, role } = useAuth();
  const { activeOrg } = useOrganization();
  const { projects } = useProjects();
  const { reports, create, submit, review } = useFieldReports();
  const [open, setOpen] = useState(false);
  const [reviewing, setReviewing] = useState<FieldReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const isManager = role === 'admin' || role === 'manager';

  // Projects assigned to current user (as beneficiary)
  const assigned = useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('project_beneficiaries')
        .select('project_id')
        .eq('beneficiary_id', user.id);
      if (error) throw error;
      return (data || []).map(r => r.project_id);
    },
    enabled: !!user,
  });

  const assignedProjects = useMemo(() => {
    const ids = new Set(assigned.data || []);
    return projects.filter(p => ids.has(p.id));
  }, [projects, assigned.data]);

  const projectsForUser = isManager ? projects : assignedProjects;
  const projectName = (id: string) => projectsForUser.find(p => p.id === id)?.org || projects.find(p => p.id === id)?.org || '—';

  const [form, setForm] = useState({
    project_id: '', period_start: '', period_end: '', narrative: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeOrg) return;
    const parsed = fieldReportSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    const d = parsed.data;
    create.mutate({
      project_id: d.project_id,
      organization_id: activeOrg.id,
      beneficiary_id: user.id,
      period_start: d.period_start,
      period_end: d.period_end,
      narrative: d.narrative,
      indicators: [],
      attachments: [],
      status: 'draft',
    }, {
      onSuccess: () => { setOpen(false); setForm({ project_id: '', period_start: '', period_end: '', narrative: '' }); },
    });
  };

  const submitReview = () => {
    if (!reviewing) return;
    review.mutate({ id: reviewing.id, notes: reviewNotes }, {
      onSuccess: () => { setReviewing(null); setReviewNotes(''); },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Rapports de terrain
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isManager ? 'Tous les rapports soumis par les bénéficiaires.' : 'Soumettez vos rapports narratifs sur les projets qui vous sont assignés.'}
          </p>
        </div>
        {!isManager && assignedProjects.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><FileEdit className="w-4 h-4" /> Nouveau rapport</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau rapport de terrain</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1">
                  <Label>Projet *</Label>
                  <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                    <SelectContent>
                      {assignedProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.org} — {p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Début *</Label><Input type="date" required value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Fin *</Label><Input type="date" required value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} /></div>
                </div>
                <div className="space-y-1">
                  <Label>Narratif *</Label>
                  <Textarea required rows={6} value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))} placeholder="Activités menées, résultats, difficultés rencontrées…" />
                </div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" disabled={create.isPending}>Créer</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isManager && assignedProjects.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun projet ne vous est assigné. Contactez un administrateur.
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider">
            <tr>{['Projet', 'Période', 'Statut', 'Narratif', 'Actions'].map(h => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center italic text-muted-foreground">Aucun rapport.</td></tr>
            ) : reports.map(r => {
              const s = STATUS[r.status];
              return (
                <tr key={r.id} className="border-t hover:bg-muted/30 align-top">
                  <td className="px-3 py-2 font-medium">{projectName(r.project_id)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.period_start} → {r.period_end}</td>
                  <td className="px-3 py-2"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${s.cls}`}>{s.icon} {s.label}</span></td>
                  <td className="px-3 py-2 text-xs max-w-md"><div className="line-clamp-2">{r.narrative}</div></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {!isManager && r.status === 'draft' && r.beneficiary_id === user?.id && (
                        <Button size="sm" variant="outline" onClick={() => submit.mutate(r.id)} className="h-7 text-xs gap-1"><Send className="w-3 h-3" /> Soumettre</Button>
                      )}
                      {isManager && r.status === 'submitted' && (
                        <Button size="sm" variant="outline" onClick={() => { setReviewing(r); setReviewNotes(''); }} className="h-7 text-xs gap-1"><CheckCircle2 className="w-3 h-3" /> Réviser</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!reviewing} onOpenChange={(v) => !v && setReviewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Marquer comme révisé</DialogTitle></DialogHeader>
          <Textarea rows={4} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Commentaires (optionnel)…" />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReviewing(null)}>Annuler</Button><Button onClick={submitReview}>Valider</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
