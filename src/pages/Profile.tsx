import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Save, Loader2 } from 'lucide-react';

interface ProfileData {
  first_name: string;
  last_name: string;
  organization: string;
  phone: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileData>({ first_name: '', last_name: '', organization: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setForm({ first_name: data.first_name, last_name: data.last_name, organization: data.organization, phone: data.phone });
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('user_id', user.id);
    if (error) toast.error('Erreur: ' + error.message);
    else toast.success('Profil mis à jour');
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Mon profil</h1>
        <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="rounded-[10px] border border-rule bg-card">
        <div className="border-b border-rule px-4 py-3 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold">Informations personnelles</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium text-steel mb-1">Prénom</label>
              <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-steel mb-1">Nom</label>
              <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Organisation</label>
            <input type="text" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Téléphone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
