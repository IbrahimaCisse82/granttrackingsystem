import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export type CalendarEventType = 'report_deadline' | 'payment' | 'project_end' | 'risk_review';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string; // ISO date (YYYY-MM-DD)
  title: string;
  project_id: string | null;
  project_org: string | null;
  meta?: Record<string, any>;
}

export function useCalendarEvents() {
  const { activeOrgId } = useOrganization();

  return useQuery({
    queryKey: ['calendar-events', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async (): Promise<CalendarEvent[]> => {
      const events: CalendarEvent[] = [];

      // Projects for lookups + project_end events
      const { data: projects } = await supabase
        .from('projects')
        .select('id, org, title, fin, archived')
        .eq('organization_id', activeOrgId!);
      const projMap = new Map<string, { org: string; title: string }>();
      (projects || []).forEach((p: any) => {
        if (p.archived) return;
        projMap.set(p.id, { org: p.org, title: p.title });
        if (p.fin) {
          events.push({
            id: `pe-${p.id}`,
            type: 'project_end',
            date: String(p.fin).slice(0, 10),
            title: `Fin projet — ${p.org}`,
            project_id: p.id,
            project_org: p.org,
          });
        }
      });

      // Periodic reports
      const { data: reports } = await (supabase as any)
        .from('periodic_reports')
        .select('id, project_id, report_index, deadline_approval, status')
        .eq('organization_id', activeOrgId!)
        .not('deadline_approval', 'is', null);
      (reports || []).forEach((r: any) => {
        const p = projMap.get(r.project_id);
        events.push({
          id: `rd-${r.id}`,
          type: 'report_deadline',
          date: String(r.deadline_approval).slice(0, 10),
          title: `Rapport N°${String(r.report_index).padStart(3, '0')} — ${p?.org || ''}`,
          project_id: r.project_id,
          project_org: p?.org || null,
          meta: { status: r.status },
        });
      });

      // Payment vouchers
      const { data: vouchers } = await (supabase as any)
        .from('payment_vouchers')
        .select('id, project_id, voucher_number, payment_date, amount_local, currency, status')
        .eq('organization_id', activeOrgId!);
      (vouchers || []).forEach((v: any) => {
        const p = projMap.get(v.project_id);
        events.push({
          id: `pv-${v.id}`,
          type: 'payment',
          date: String(v.payment_date).slice(0, 10),
          title: `Versement ${v.voucher_number} — ${p?.org || ''}`,
          project_id: v.project_id,
          project_org: p?.org || null,
          meta: { amount: v.amount_local, currency: v.currency, status: v.status },
        });
      });

      // Risk reviews
      const { data: risks } = await (supabase as any)
        .from('project_risks')
        .select('id, project_id, description, review_date, status, score')
        .eq('organization_id', activeOrgId!)
        .not('review_date', 'is', null);
      (risks || []).forEach((r: any) => {
        const p = projMap.get(r.project_id);
        events.push({
          id: `rr-${r.id}`,
          type: 'risk_review',
          date: String(r.review_date).slice(0, 10),
          title: `Revue risque — ${r.description?.slice(0, 40) || ''}`,
          project_id: r.project_id,
          project_org: p?.org || null,
          meta: { status: r.status, score: r.score },
        });
      });

      return events.sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
