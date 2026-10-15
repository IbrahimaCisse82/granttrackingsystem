import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProjectAiSummary({ projectId }: { projectId: string }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: reports = [] } = useQuery({
    queryKey: ['periodic-reports-list', projectId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from('periodic_reports')
        .select('report_index, status, period_start, period_end').eq('project_id', projectId).order('report_index');
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = (i: number) => setSelected(s => (s.includes(i) ? s.filter(x => x !== i) : [...s, i]));

  const generate = async () => {
    setLoading(true); setText('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/project-ai-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ project_id: projectId, report_indexes: selected, lang: i18n.language?.startsWith('en') ? 'en' : 'fr' }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t('aiSummary.error'));
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText(prev => prev + dec.decode(value, { stream: true }));
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" />{t('aiSummary.button')}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t('aiSummary.title')}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">{t('aiSummary.pickReports')}</p>
        <div className="flex flex-wrap gap-3">
          {reports.length === 0 && <span className="text-xs italic text-muted-foreground">{t('aiSummary.noReports')}</span>}
          {reports.map(r => (
            <label key={r.report_index} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={selected.includes(r.report_index)} onCheckedChange={() => toggle(r.report_index)} />
              {t('aiSummary.period', { n: r.report_index + 1 })} <span className="text-[10px] text-muted-foreground">({r.status})</span>
            </label>
          ))}
        </div>
        <Button onClick={generate} disabled={loading || selected.length === 0} className="self-start gap-1.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{t('aiSummary.generate')}
        </Button>
        {text && <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed">{text}</div>}
        {text && <p className="text-[10px] text-muted-foreground">{t('aiSummary.disclaimer')}</p>}
      </DialogContent>
    </Dialog>
  );
}
