import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ShieldAlert, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface Factor { id: string; status: string; friendly_name?: string | null; factor_type: string; }

export default function MfaSection() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState<{ qr: string; secret: string; factorId: string } | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors([...(data?.totp || [])] as Factor[]);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const verified = factors.find(f => f.status === 'verified');

  const startEnroll = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `G-GTS ${new Date().toLocaleDateString()}` });
    if (error) { toast.error(error.message); return; }
    setEnrolling({ qr: data.totp.qr_code, secret: data.totp.secret, factorId: data.id });
  };

  const verify = async () => {
    if (!enrolling) return;
    const { data: chal, error: e1 } = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
    if (e1 || !chal) { toast.error(e1?.message || 'Erreur'); return; }
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId: enrolling.factorId, challengeId: chal.id, code });
    if (e2) { toast.error(e2.message); return; }
    toast.success('MFA activée');
    setEnrolling(null); setCode('');
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Désactiver la MFA ?')) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { toast.error(error.message); return; }
    toast.success('MFA désactivée');
    refresh();
  };

  if (loading) return null;

  return (
    <div className="rounded-[10px] border border-rule bg-card mt-4">
      <div className="border-b border-rule px-4 py-3 flex items-center gap-2">
        {verified ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-amber-600" />}
        <h3 className="text-[13px] font-semibold">Sécurité — Double authentification (TOTP)</h3>
      </div>
      <div className="p-4 space-y-3 text-sm">
        {verified ? (
          <div className="flex items-center justify-between">
            <p className="text-emerald-700">MFA activée — vos connexions sont protégées par un code à usage unique.</p>
            <Button size="sm" variant="destructive" onClick={() => remove(verified.id)}>Désactiver</Button>
          </div>
        ) : enrolling ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Scannez ce QR code avec votre app d'authentification (Google Authenticator, Authy…) puis saisissez le code à 6 chiffres.
            </p>
            <img src={enrolling.qr} alt="MFA QR" className="w-48 h-48 border rounded" />
            <p className="text-[11px] font-mono break-all text-muted-foreground">Secret : {enrolling.secret}</p>
            <div className="flex gap-2 items-end">
              <div className="space-y-1 flex-1 max-w-xs">
                <Label>Code à 6 chiffres</Label>
                <Input value={code} onChange={e => setCode(e.target.value)} maxLength={6} placeholder="123456" />
              </div>
              <Button onClick={verify} disabled={code.length !== 6}>Vérifier</Button>
              <Button variant="outline" onClick={() => { setEnrolling(null); setCode(''); }}>Annuler</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Renforcez la sécurité de votre compte avec une application TOTP.</p>
            <Button size="sm" onClick={startEnroll} className="gap-1.5"><KeyRound className="w-4 h-4" /> Activer la MFA</Button>
          </div>
        )}
      </div>
    </div>
  );
}
