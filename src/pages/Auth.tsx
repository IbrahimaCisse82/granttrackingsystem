import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/logo-growhub.png';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: firstName, last_name: lastName },
      },
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Inscription réussie', description: 'Vérifiez votre boîte mail pour confirmer votre compte.' });
      setMode('login');
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email envoyé', description: 'Consultez votre boîte mail pour réinitialiser votre mot de passe.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-card rounded-xl border border-border p-8 shadow-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-sidebar rounded-lg p-3 mb-3">
              <img src={logo} alt="Grow Hub" className="h-6 w-auto" />
            </div>
            <h1 className="text-lg font-bold text-foreground">GH-GTS</h1>
            <p className="text-xs text-muted-foreground">Grants Tracking System</p>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mot de passe</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-enabel-dark transition-colors disabled:opacity-50">
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
              <div className="flex justify-between text-xs">
                <button type="button" onClick={() => setMode('forgot')} className="text-primary hover:underline">Mot de passe oublié ?</button>
                <button type="button" onClick={() => setMode('signup')} className="text-primary hover:underline">Créer un compte</button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Prénom</label>
                  <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Nom</label>
                  <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Mot de passe</label>
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-enabel-dark transition-colors disabled:opacity-50">
                {loading ? 'Inscription…' : "S'inscrire"}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-xs text-primary hover:underline">
                Déjà un compte ? Se connecter
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-xs text-muted-foreground">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-enabel-dark transition-colors disabled:opacity-50">
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-xs text-primary hover:underline">
                Retour à la connexion
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-4">Grow Hub SARL · GH-GTS v3.0 · © 2024</p>
      </div>
    </div>
  );
}
