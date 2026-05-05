import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';

interface Props {
  moduleId: string;
  title: string;
  description: string;
}

export function OnboardingTip({ moduleId, title, description }: Props) {
  const { show, dismiss } = useOnboarding(moduleId);
  if (!show) return null;
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
      <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <Button size="sm" variant="ghost" onClick={dismiss} aria-label="Fermer">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
