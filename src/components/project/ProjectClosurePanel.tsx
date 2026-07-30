import { useTranslation } from 'react-i18next';
import { useClosureChecklist } from '@/hooks/useClosureChecklist';
import { CheckCircle2, Circle, Loader2, ShieldCheck } from 'lucide-react';
import type { Project } from '@/lib/types';

interface Props { project: Project; readOnly?: boolean }

export default function ProjectClosurePanel({ project, readOnly }: Props) {
  const { t, i18n } = useTranslation();
  const { items, isLoading, progress, done, total, update } = useClosureChecklist(project.id);
  const lng = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';

  const daysToEnd = project.fin
    ? Math.floor((new Date(project.fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-rule bg-card p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> {t('closure.heading')}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t('closure.subtitle')}
              {daysToEnd !== null && daysToEnd < 60 && (
                <span className="ml-2 rounded bg-amber/10 text-amber px-1.5 py-0.5 text-[10px] font-medium">
                  {t('closure.endsIn', { count: daysToEnd })}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-semibold">{progress}%</div>
            <div className="text-[10px] text-muted-foreground">{done} / {total}</div>
          </div>
        </div>
        <div className="h-2 rounded bg-muted overflow-hidden">
          <div className={`h-full transition-all ${progress === 100 ? 'bg-emerald' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-[10px] border border-rule bg-card">
        {items.map((item, idx) => (
          <div key={item.id} className={`p-4 flex items-start gap-3 ${idx > 0 ? 'border-t border-rule' : ''}`}>
            <button
              disabled={readOnly}
              onClick={() => update.mutate({ id: item.id, checked: !item.checked })}
              className="mt-0.5 disabled:opacity-50"
              aria-label={item.checked ? t('closure.uncheck') : t('closure.check')}
            >
              {item.checked
                ? <CheckCircle2 className="w-5 h-5 text-emerald" />
                : <Circle className="w-5 h-5 text-muted-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.item_label}
              </p>
              <textarea
                readOnly={readOnly}
                defaultValue={item.notes}
                onBlur={(e) => {
                  if (e.target.value !== item.notes) update.mutate({ id: item.id, notes: e.target.value });
                }}
                placeholder={t('closure.notePlaceholder')}
                aria-label={t('closure.notes')}
                rows={1}
                className="mt-1.5 w-full resize-none rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary"
              />
              {item.checked && item.checked_at && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {t('closure.checkedOn', { date: new Date(item.checked_at).toLocaleDateString(lng) })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {progress < 100 && (
        <p className="text-[11px] text-amber italic">
          {t('closure.incomplete')}
        </p>
      )}
    </div>
  );
}
