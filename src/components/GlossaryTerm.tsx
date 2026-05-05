import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGlossary } from '@/hooks/useGlossary';

interface Props {
  term: string;
  children?: React.ReactNode;
}

export function GlossaryTerm({ term, children }: Props) {
  const { data } = useGlossary();
  const entry = data?.find(t => t.term.toLowerCase() === term.toLowerCase());
  if (!entry) return <>{children ?? term}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/50">
          {children ?? term}
          <HelpCircle className="w-3 h-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold text-xs mb-1">{entry.term}</p>
        <p className="text-xs">{entry.definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
