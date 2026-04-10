import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Building2, Check, X, Edit2, Mail, Phone, Globe, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { fmt } from '@/lib/utils-project';
import type { Project } from '@/lib/types';

export interface Bailleur {
  id: string;
  name: string;
  type: 'bilateral' | 'multilateral' | 'prive' | 'ong' | 'gouvernement' | 'autre';
  contribution: number;
  devise: string;
  reference: string;
  dateAccord: string;
  dateDebut: string;
  dateFin: string;
  contact: string;
  email: string;
  telephone: string;
  conditions: string;
  decaissements: { date: string; montant: number; reference: string }[];
  statut: 'actif' | 'cloture' | 'suspendu';
}

interface Props {
  project: Project;
  onSave: (partial: Partial<Project>) => void;
  readOnly: boolean;
}

const TYPE_LABELS: Record<Bailleur['type'], string> = {
  bilateral: 'Bilatéral',
  multilateral: 'Multilatéral',
  prive: 'Secteur privé',
  ong: 'ONG / Fondation',
  gouvernement: 'Gouvernement',
  autre: 'Autre',
};

const STATUT_CONFIG = {
  actif: { label: 'Actif', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  cloture: { label: 'Clôturé', class: 'bg-muted text-muted-foreground' },
  suspendu: { label: 'Suspendu', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

function generateId() {
  return 'bail-' + Math.random().toString(36).slice(2, 10);
}

const emptyForm = (): Partial<Bailleur> => ({
  name: '', type: 'bilateral', contribution: 0, devise: 'FCFA', reference: '',
  dateAccord: '', dateDebut: '', dateFin: '', contact: '', email: '', telephone: '',
  conditions: '', decaissements: [], statut: 'actif',
});

export default function ProjectBailleurs({ project, onSave, readOnly }: Props) {
  const bailleurs: Bailleur[] = (project as any).bailleurs || [];
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Bailleur>>(emptyForm());
  const [showDecaissement, setShowDecaissement] = useState<string | null>(null);
  const [decForm, setDecForm] = useState({ date: '', montant: 0, reference: '' });

  const save = useCallback((list: Bailleur[]) => {
    onSave({ bailleurs: list } as any);
  }, [onSave]);

  const handleAdd = () => {
    if (!form.name?.trim()) { toast.error('Le nom du bailleur est requis'); return; }
    if (!form.contribution || form.contribution <= 0) { toast.error('Le montant de la contribution est requis'); return; }
    const newB: Bailleur = {
      id: generateId(),
      name: form.name!,
      type: form.type as Bailleur['type'],
      contribution: form.contribution!,
      devise: form.devise || project.devise,
      reference: form.reference || '',
      dateAccord: form.dateAccord || '',
      dateDebut: form.dateDebut || '',
      dateFin: form.dateFin || '',
      contact: form.contact || '',
      email: form.email || '',
      telephone: form.telephone || '',
      conditions: form.conditions || '',
      decaissements: [],
      statut: form.statut as Bailleur['statut'] || 'actif',
    };
    save([...bailleurs, newB]);
    setShowAdd(false);
    setForm(emptyForm());
    toast.success('Bailleur ajouté');
  };

  const handleUpdate = () => {
    if (!editId) return;
    save(bailleurs.map(b => b.id === editId ? { ...b, ...form, id: editId, decaissements: b.decaissements } as Bailleur : b));
    setEditId(null);
    setForm(emptyForm());
    toast.success('Bailleur mis à jour');
  };

  const handleDelete = (id: string) => {
    save(bailleurs.filter(b => b.id !== id));
    toast.success('Bailleur supprimé');
  };

  const handleAddDecaissement = (bId: string) => {
    if (!decForm.montant || decForm.montant <= 0) { toast.error('Le montant est requis'); return; }
    save(bailleurs.map(b => b.id === bId
      ? { ...b, decaissements: [...b.decaissements, { ...decForm }] }
      : b
    ));
    setDecForm({ date: '', montant: 0, reference: '' });
    setShowDecaissement(null);
    toast.success('Décaissement enregistré');
  };

  const handleDeleteDecaissement = (bId: string, idx: number) => {
    save(bailleurs.map(b => b.id === bId
      ? { ...b, decaissements: b.decaissements.filter((_, i) => i !== idx) }
      : b
    ));
  };

  const totalContributions = bailleurs.reduce((s, b) => s + b.contribution, 0);
  const totalDecaisse = bailleurs.reduce((s, b) => s + b.decaissements.reduce((a, d) => a + d.montant, 0), 0);
  const tauxDecaissement = totalContributions > 0 ? (totalDecaisse / totalContributions) * 100 : 0;

  const startEdit = (b: Bailleur) => {
    setEditId(b.id);
    setForm({ ...b });
    setShowAdd(false);
  };

  const renderForm = (isEdit: boolean) => (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{isEdit ? 'Modifier le bailleur' : 'Nouveau bailleur'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom du bailleur *</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Union Européenne, USAID, AFD..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Contribution *</label>
            <Input type="number" value={form.contribution} onChange={e => setForm({ ...form, contribution: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Devise</label>
            <Select value={form.devise} onValueChange={v => setForm({ ...form, devise: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FCFA">FCFA</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CHF">CHF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Réf. accord</label>
            <Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="N° contrat" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Statut</label>
            <Select value={form.statut} onValueChange={v => setForm({ ...form, statut: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="cloture">Clôturé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date accord</label>
            <Input type="date" value={form.dateAccord} onChange={e => setForm({ ...form, dateAccord: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Début financement</label>
            <Input type="date" value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Fin financement</label>
            <Input type="date" value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Personne contact</label>
            <Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Nom du contact" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@bailleur.org" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Téléphone</label>
            <Input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+33 ..." />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Conditions particulières</label>
          <Textarea value={form.conditions} onChange={e => setForm({ ...form, conditions: e.target.value })} placeholder="Conditions de décaissement, obligations de reporting..." rows={2} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { if (isEdit) { setEditId(null); } else { setShowAdd(false); } setForm(emptyForm()); }}>
            <X className="w-4 h-4 mr-1" /> Annuler
          </Button>
          <Button size="sm" onClick={isEdit ? handleUpdate : handleAdd}>
            <Check className="w-4 h-4 mr-1" /> {isEdit ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Building2 className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{bailleurs.length}</p>
                <p className="text-xs text-muted-foreground">Bailleurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2"><Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
              <div>
                <p className="text-lg font-bold">{fmt(totalContributions)}</p>
                <p className="text-xs text-muted-foreground">Total contributions ({project.devise})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2"><Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
              <div>
                <p className="text-lg font-bold">{fmt(totalDecaisse)}</p>
                <p className="text-xs text-muted-foreground">Total décaissé ({project.devise})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium">Taux décaissement</span>
              <span className="text-sm font-bold ml-auto">{tauxDecaissement.toFixed(0)}%</span>
            </div>
            <Progress value={tauxDecaissement} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      {!readOnly && !editId && (
        <div className="flex justify-end">
          <Button onClick={() => { setShowAdd(!showAdd); setForm(emptyForm()); }} variant={showAdd ? 'outline' : 'default'} size="sm">
            {showAdd ? <><X className="w-4 h-4 mr-1" /> Annuler</> : <><Plus className="w-4 h-4 mr-1" /> Ajouter un bailleur</>}
          </Button>
        </div>
      )}

      {showAdd && !readOnly && !editId && renderForm(false)}
      {editId && !readOnly && renderForm(true)}

      {/* Bailleur cards */}
      {bailleurs.map(b => {
        const decTotal = b.decaissements.reduce((s, d) => s + d.montant, 0);
        const pct = b.contribution > 0 ? (decTotal / b.contribution) * 100 : 0;
        const cfg = STATUT_CONFIG[b.statut];
        const share = totalContributions > 0 ? (b.contribution / totalContributions) * 100 : 0;

        if (editId === b.id) return null;

        return (
          <Card key={b.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2"><Building2 className="w-5 h-5 text-primary" /></div>
                  <div>
                    <CardTitle className="text-base">{b.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[b.type]}</Badge>
                      <Badge className={`text-[10px] ${cfg.class}`}>{cfg.label}</Badge>
                      {b.reference && <span className="text-[10px] text-muted-foreground font-mono">{b.reference}</span>}
                    </div>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(b)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Financial info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground">Contribution:</span><br/><span className="font-bold text-sm">{fmt(b.contribution)} {b.devise}</span></div>
                <div><span className="text-muted-foreground">Décaissé:</span><br/><span className="font-bold text-sm">{fmt(decTotal)} {b.devise}</span></div>
                <div><span className="text-muted-foreground">Solde:</span><br/><span className="font-bold text-sm">{fmt(b.contribution - decTotal)} {b.devise}</span></div>
                <div><span className="text-muted-foreground">Part du budget:</span><br/><span className="font-bold text-sm">{share.toFixed(1)}%</span></div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Taux de décaissement</span>
                  <span className="text-xs font-bold">{pct.toFixed(0)}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>

              {/* Contact */}
              {(b.contact || b.email || b.telephone) && (
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {b.contact && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{b.contact}</span>}
                  {b.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.email}</span>}
                  {b.telephone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.telephone}</span>}
                </div>
              )}

              {/* Dates */}
              {(b.dateAccord || b.dateDebut || b.dateFin) && (
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {b.dateAccord && <span>Accord: <strong>{b.dateAccord}</strong></span>}
                  {b.dateDebut && <span>Début: <strong>{b.dateDebut}</strong></span>}
                  {b.dateFin && <span>Fin: <strong>{b.dateFin}</strong></span>}
                </div>
              )}

              {b.conditions && <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-3">{b.conditions}</p>}

              {/* Decaissements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Décaissements ({b.decaissements.length})</span>
                  {!readOnly && (
                    <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setShowDecaissement(showDecaissement === b.id ? null : b.id)}>
                      <Plus className="w-3 h-3 mr-1" /> Décaissement
                    </Button>
                  )}
                </div>

                {showDecaissement === b.id && !readOnly && (
                  <div className="flex items-end gap-2 mb-2 p-2 rounded-md bg-muted/30">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground">Date</label>
                      <Input type="date" className="h-7 text-xs" value={decForm.date} onChange={e => setDecForm({ ...decForm, date: e.target.value })} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground">Montant ({b.devise})</label>
                      <Input type="number" className="h-7 text-xs" value={decForm.montant} onChange={e => setDecForm({ ...decForm, montant: Number(e.target.value) })} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground">Référence</label>
                      <Input className="h-7 text-xs" value={decForm.reference} onChange={e => setDecForm({ ...decForm, reference: e.target.value })} />
                    </div>
                    <Button size="sm" className="h-7" onClick={() => handleAddDecaissement(b.id)}><Check className="w-3 h-3" /></Button>
                  </div>
                )}

                {b.decaissements.length > 0 && (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50"><th className="px-3 py-1.5 text-left">Date</th><th className="px-3 py-1.5 text-right">Montant</th><th className="px-3 py-1.5 text-left">Réf.</th>{!readOnly && <th className="w-8" />}</tr></thead>
                      <tbody>
                        {b.decaissements.map((d, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-1.5">{d.date || '—'}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{fmt(d.montant)} {b.devise}</td>
                            <td className="px-3 py-1.5">{d.reference || '—'}</td>
                            {!readOnly && (
                              <td className="px-1">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteDecaissement(b.id, i)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {bailleurs.length === 0 && !showAdd && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Aucun bailleur enregistré pour ce projet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Ajoutez les sources de financement pour suivre les contributions et décaissements.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
