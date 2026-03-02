import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/logo-growhub.png';
import { motion, AnimatePresence } from 'framer-motion';

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

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground";

  const titles: Record<string, { title: string; subtitle: string }> = {
    login: { title: 'Connexion', subtitle: 'Accédez à votre espace de suivi' },
    signup: { title: 'Créer un compte', subtitle: 'Rejoignez la plateforme GTS' },
    forgot: { title: 'Mot de passe oublié', subtitle: 'Recevez un lien de réinitialisation' },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-[hsl(var(--enabel-light))]">
      {/* Decorative circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[hsl(var(--enabel)/0.06)] blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-[hsl(var(--teal)/0.05)] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 shadow-[var(--shadow-md)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl bg-[hsl(var(--enabel)/0.15)] blur-lg scale-125" />
              <div className="relative bg-sidebar rounded-2xl p-4">
                <img src={logo} alt="Grow Hub" className="h-8 w-auto brightness-0 invert" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">GH-GTS</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Grants Tracking System</p>
          </div>

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-lg font-semibold text-foreground">{titles[mode].title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{titles[mode].subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Mot de passe</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputClass} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md">
                  {loading ? 'Connexion…' : 'Se connecter'}
                </button>
                <div className="flex justify-between text-xs pt-1">
                  <button type="button" onClick={() => setMode('forgot')} className="text-muted-foreground hover:text-primary transition-colors">Mot de passe oublié ?</button>
                  <button type="button" onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">Créer un compte</button>
                </div>
              </motion.form>
            )}

            {mode === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignup}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Prénom</label>
                    <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="Jean" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Nom</label>
                    <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="Dupont" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Mot de passe</label>
                  <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 caractères" className={inputClass} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md">
                  {loading ? 'Inscription…' : "S'inscrire"}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors pt-1">
                  Déjà un compte ? <span className="font-medium text-primary">Se connecter</span>
                </button>
              </motion.form>
            )}

            {mode === 'forgot' && (
              <motion.form
                key="forgot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleForgot}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" className={inputClass} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md">
                  {loading ? 'Envoi…' : 'Envoyer le lien'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
                  ← Retour à la connexion
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-5 opacity-60">
          Grow Hub SARL · GH-GTS v3.0 · © 2024
        </p>
      </motion.div>
    </div>
  );
}
