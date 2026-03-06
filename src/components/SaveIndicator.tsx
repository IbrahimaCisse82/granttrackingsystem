import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface Props {
  saving: boolean;
}

export default function SaveIndicator({ saving }: Props) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!saving) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saving]);

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> Sauvegarde…
      </span>
    );
  }

  if (showSaved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald">
        <Check className="w-3 h-3" /> Sauvegardé
      </span>
    );
  }

  return null;
}
