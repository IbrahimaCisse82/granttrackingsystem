import { useState } from 'react';
import { usePaymentVouchers, type PaymentVoucher, type VoucherStatus } from '@/hooks/usePaymentVouchers';
import { useOrganization } from '@/hooks/useOrganization';
import { useReadOnly } from '@/hooks/useReadOnly';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, FileDown, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { ISO_CURRENCIES } from '@/hooks/useExchangeRates';
import { fmt } from '@/lib/utils-project';
import { exportPaymentVoucherPDF } from '@/lib/export-payment-voucher';
import { paymentVoucherSchema, formatZodError } from '@/lib/schemas';
import { toast } from 'sonner';
import type { Project } from '@/lib/types';

interface Props {
  project: Project;
}

const STATUS_LABEL: Record<VoucherStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-3 h-3" /> },
  received: { label: 'Reçu', color: 'text-blue-600 bg-blue-50', icon: <CheckCircle2 className="w-3 h-3" /> },
  reconciled: { label: 'Réconcilié', color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function PaymentVouchersPanel({ project }: Props) {
  const { activeOrg } = useOrganization();
  const readOnly = useReadOnly((project as any).userId);
  const { vouchers, add, update, remove } = usePaymentVouchers(project.id);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    voucher_number: '',
    amount_local: '',
    currency: project.devise || 'XOF',
    exchange_rate: String(project.taux || 655.957),
    payment_date: new Date().toISOString().slice(0, 10),
    donor_reference: '',
    bank_reference: '',
    notes: '',
  });

  const reset = () => setForm({
    voucher_number: '', amount_local: '', currency: project.devise || 'XOF',
    exchange_rate: String(project.taux || 655.957),
    payment_date: new Date().toISOString().slice(0, 10),
    donor_reference: '', bank_reference: '', notes: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    const parsed = paymentVoucherSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(formatZodError(parsed.error));
      return;
    }
    const d = parsed.data;
    add.mutate({
      project_id: project.id,
      organization_id: activeOrg.id,
      report_id: null,
      voucher_number: d.voucher_number,
      amount_local: d.amount_local,
      amount_eur: d.exchange_rate > 0 ? Math.round((d.amount_local / d.exchange_rate) * 100) / 100 : d.amount_local,
      currency: d.currency,
      exchange_rate: d.exchange_rate,
      payment_date: d.payment_date,
      donor_reference: d.donor_reference || null,
      bank_reference: d.bank_reference || null,
      status: 'pending',
      notes: d.notes || null,
    }, {
      onSuccess: () => { reset(); setOpen(false); },
    });
  };

  const setStatus = (v: PaymentVoucher, status: VoucherStatus) => {
    update.mutate({ id: v.id, patch: { status } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Fiches de versement</h2>
          <p className="text-xs text-muted-foreground">{vouchers.length} fiche(s) — {project.org}</p>
        </div>
        {!readOnly && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nouvelle fiche</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Créer une fiche de versement</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>N° Fiche *</Label>
                    <Input value={form.voucher_number} onChange={e => setForm(f => ({ ...f, voucher_number: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Date paiement *</Label>
                    <Input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 col-span-1">
                    <Label>Devise</Label>
                    <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ISO_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Montant *</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount_local} onChange={e => setForm(f => ({ ...f, amount_local: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Taux → EUR</Label>
                    <Input type="number" step="0.000001" min="0" value={form.exchange_rate} onChange={e => setForm(f => ({ ...f, exchange_rate: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Réf. bailleur</Label><Input value={form.donor_reference} onChange={e => setForm(f => ({ ...f, donor_reference: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Réf. bancaire</Label><Input value={form.bank_reference} onChange={e => setForm(f => ({ ...f, bank_reference: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={add.isPending}>{add.isPending ? 'Création…' : 'Créer'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider">
              <tr>
                {['N°', 'Date', 'Montant', 'EUR', 'Réf. bailleur', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground italic">Aucune fiche de versement.</td></tr>
              ) : vouchers.map(v => {
                const s = STATUS_LABEL[v.status];
                return (
                  <tr key={v.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono font-semibold">{v.voucher_number}</td>
                    <td className="px-3 py-2 font-mono text-xs">{v.payment_date}</td>
                    <td className="px-3 py-2 font-mono text-right">{fmt(v.amount_local)} {v.currency}</td>
                    <td className="px-3 py-2 font-mono text-right text-primary">{fmt(v.amount_eur || 0)} €</td>
                    <td className="px-3 py-2 text-xs">{v.donor_reference || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${s.color}`}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => exportPaymentVoucherPDF(v, project, activeOrg?.name)} title="Exporter PDF" className="p-1 hover:bg-muted rounded">
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                        {!readOnly && v.status === 'pending' && (
                          <button onClick={() => setStatus(v, 'received')} title="Marquer reçu" className="p-1 hover:bg-muted rounded text-blue-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!readOnly && v.status === 'received' && (
                          <button onClick={() => setStatus(v, 'reconciled')} title="Marquer réconcilié" className="p-1 hover:bg-muted rounded text-emerald-600">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!readOnly && (
                          <button onClick={() => { if (confirm('Supprimer cette fiche ?')) remove.mutate(v.id); }} className="p-1 hover:bg-muted rounded text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
