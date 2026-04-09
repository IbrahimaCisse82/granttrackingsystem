import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { Building2, ArrowRight } from 'lucide-react';

export default function OrganizationOnboarding() {
  const { createOrg } = useOrganization();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'org';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createOrg(name.trim(), slug);
    } catch {
      // error handled in hook
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Bienvenue sur GH-GTS</h1>
          <p className="text-sm text-muted-foreground">
            Créez votre organisation pour commencer à gérer vos projets de subvention.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Nom de l'organisation *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Grow Hub SARL"
              required
              maxLength={100}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Identifiant (slug)</label>
            <div className="rounded-lg border border-input bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground font-mono">
              {slug || '…'}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Création…' : (
              <>Créer l'organisation <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
