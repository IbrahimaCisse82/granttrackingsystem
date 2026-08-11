import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import logo from '@/assets/logo-growhub.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Auth() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) return <Navigate to={from} replace />;


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('auth.resetSent'));
    }
    setLoading(false);
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground";

  const titles: Record<string, { title: string; subtitle: string }> = {
    login: { title: t('auth.login'), subtitle: t('auth.loginSubtitle') },
    forgot: { title: t('auth.forgot'), subtitle: t('auth.forgotSubtitle') },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-[hsl(var(--enabel-light))] px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[hsl(var(--enabel)/0.06)] blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-[hsl(var(--teal)/0.05)] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
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
            <h1 className="text-xl font-bold text-foreground tracking-tight">G-GTS</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t('auth.tagline')}</p>
          </div>

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
                  <label htmlFor="login-email" className="block text-xs font-medium text-foreground mb-1.5">{t('auth.email')}</label>
                  <input id="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" className={inputClass} autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-xs font-medium text-foreground mb-1.5">{t('auth.password')}</label>
                  <input id="login-password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputClass} autoComplete="current-password" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md">
                  {loading ? t('auth.signingIn') : t('auth.signIn')}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {t('auth.forgotLink')}
                  </button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  {t('auth.contactAdmin')}
                </p>
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
                  <label htmlFor="forgot-email" className="block text-xs font-medium text-foreground mb-1.5">{t('auth.email')}</label>
                  <input id="forgot-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" className={inputClass} autoComplete="email" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[hsl(var(--enabel-dark))] transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md">
                  {loading ? t('auth.sending') : t('auth.sendLink')}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
                  {t('auth.backToLogin')}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-5 opacity-60">
          Grow Hub SARL · G-GTS v3.0 · © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
