import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-growhub.png';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setReady(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Mot de passe mis à jour', description: 'Vous pouvez maintenant vous connecter.' });
      navigate('/');
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Lien invalide ou expiré.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-card rounded-xl border border-border p-8 shadow-md">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-sidebar rounded-lg p-3 mb-3">
              <img src={logo} alt="Grow Hub" className="h-6 w-auto" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Nouveau mot de passe</h1>
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Nouveau mot de passe</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-enabel-dark transition-colors disabled:opacity-50">
              {loading ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
