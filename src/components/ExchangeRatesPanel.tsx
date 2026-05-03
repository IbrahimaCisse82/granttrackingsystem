import { useState } from 'react';
import { useExchangeRates, ISO_CURRENCIES } from '@/hooks/useExchangeRates';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ArrowRight } from 'lucide-react';

export default function ExchangeRatesPanel() {
  const { activeOrg, orgRole } = useOrganization();
  const { rates, add, remove } = useExchangeRates(activeOrg?.id);
  const canEdit = orgRole === 'owner' || orgRole === 'admin' || orgRole === 'manager';

  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [rate, setRate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = Number(rate);
    if (!r || r <= 0) return;
    add.mutate(
      { from_currency: from, to_currency: to, rate: r, rate_date: date, source: 'manual' },
      { onSuccess: () => setRate('') }
    );
  };

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Devises &amp; Taux de change</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Configurez les paires de devises utilisées par votre organisation. Le taux par défaut FCFA → EUR (655,957) reste actif tant qu'aucun taux personnalisé n'est saisi.
        </p>
      </div>

      {canEdit && (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ISO_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Vers</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ISO_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Taux</Label>
            <Input type="number" step="0.000001" min="0" value={rate} onChange={e => setRate(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <Button type="submit" size="sm" disabled={add.isPending} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </Button>
        </form>
      )}

      <div className="border-t pt-3">
        {rates.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">Aucun taux personnalisé configuré.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {rates.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/50">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold">{r.from_currency}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="font-semibold">{r.to_currency}</span>
                  <span className="ml-3 text-primary">{r.rate}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{r.rate_date}</span>
                  {canEdit && (
                    <button onClick={() => remove.mutate(r.id)} className="text-destructive hover:opacity-70">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
