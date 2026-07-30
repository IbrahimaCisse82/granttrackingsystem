import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCalendarEvents, CalendarEvent, CalendarEventType } from '@/hooks/useCalendarEvents';
import { Calendar as DayPicker } from '@/components/ui/calendar';
import { CalendarClock, Wallet, Flag, ShieldAlert, Loader2 } from 'lucide-react';
import { fr, enUS } from 'date-fns/locale';

const TYPE_META: Record<CalendarEventType, { labelKey: string; color: string; icon: React.ReactNode }> = {
  report_deadline: { labelKey: 'calendar.short.report', color: '#DC2626', icon: <CalendarClock className="w-3.5 h-3.5" /> },
  payment: { labelKey: 'calendar.short.payment', color: '#059669', icon: <Wallet className="w-3.5 h-3.5" /> },
  project_end: { labelKey: 'calendar.short.projectEnd', color: '#B45309', icon: <Flag className="w-3.5 h-3.5" /> },
  risk_review: { labelKey: 'calendar.short.risk', color: '#7C3AED', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
};

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { data: events, isLoading } = useCalendarEvents();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const lng = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';
  const dateLocale = i18n.language?.startsWith('en') ? enUS : fr;
  const fmtDay = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(lng, { day: '2-digit', month: 'short', year: 'numeric' });

  const filtered = useMemo(() => {
    return (events || []).filter(e => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (projectFilter !== 'all' && e.project_id !== projectFilter) return false;
      return true;
    });
  }, [events, typeFilter, projectFilter]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filtered.forEach(e => {
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return map;
  }, [filtered]);

  const eventDays = useMemo(() => Array.from(eventsByDay.keys()).map(d => new Date(d + 'T00:00:00')), [eventsByDay]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    return filtered.filter(e => e.date >= today && e.date <= in30);
  }, [filtered]);

  const selectedIso = selected?.toISOString().slice(0, 10);
  const selectedEvents = selectedIso ? (eventsByDay.get(selectedIso) || []) : [];

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    (events || []).forEach(e => { if (e.project_id) map.set(e.project_id, e.project_org || ''); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [events]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{t('nav.calendar')}</h1>
        <p className="text-xs text-muted-foreground mt-1">{t('calendar.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{t('calendar.filters')}</span>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as CalendarEventType | 'all')}
          aria-label={t('calendar.filterType')}
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs">
          <option value="all">{t('calendar.allTypes')}</option>
          <option value="report_deadline">{t('calendar.types.reportDeadline')}</option>
          <option value="payment">{t('calendar.types.payment')}</option>
          <option value="project_end">{t('calendar.types.projectEnd')}</option>
          <option value="risk_review">{t('calendar.types.riskReview')}</option>
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          aria-label={t('calendar.filterProject')}
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs">
          <option value="all">{t('calendar.allProjects')}</option>
          {projects.map(([id, org]) => (
            <option key={id} value={id}>{org}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-3">
          {(Object.keys(TYPE_META) as CalendarEventType[]).map(ty => (
            <span key={ty} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background: TYPE_META[ty].color }} />
              {t(TYPE_META[ty].labelKey)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-[10px] border border-border bg-card p-4">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setSelected}
            locale={dateLocale}
            className="w-full"
            modifiers={{ hasEvent: eventDays }}
            modifiersClassNames={{ hasEvent: 'bg-primary/15 font-semibold text-primary' }}
          />
          {selectedIso && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground mb-2">{fmtDay(selectedIso)}</p>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">{t('calendar.noEventDay')}</p>
              ) : (
                <ul className="space-y-1.5">
                  {selectedEvents.map(e => <EventRow key={e.id} e={e} onOpen={() => e.project_id && navigate(`/projects/${e.project_id}`)} />)}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Next 30 days */}
        <div className="rounded-[10px] border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('calendar.next30')}</h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t('calendar.noUpcoming')}</p>
          ) : (
            <ul className="space-y-2 max-h-[600px] overflow-y-auto">
              {upcoming.map(e => (
                <li key={e.id}>
                  <button onClick={() => e.project_id && navigate(`/projects/${e.project_id}`)}
                    className="w-full text-left rounded-lg border border-border/60 bg-background/50 p-2.5 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-muted-foreground">{fmtDay(e.date)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: TYPE_META[e.type].color + '18', color: TYPE_META[e.type].color }}>
                        {TYPE_META[e.type].icon}{t(TYPE_META[e.type].labelKey)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground line-clamp-2">{e.title}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ e, onOpen }: { e: CalendarEvent; onOpen: () => void }) {
  const { t } = useTranslation();
  const meta = TYPE_META[e.type];
  return (
    <li>
      <button onClick={onOpen} className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition-colors">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ background: meta.color + '18', color: meta.color }}>
          {meta.icon}{t(meta.labelKey)}
        </span>
        <span className="text-xs text-foreground flex-1 truncate">{e.title}</span>
      </button>
    </li>
  );
}
