import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { usePeriodicReports, type PeriodicReport, type ReportStatus } from '@/hooks/usePeriodicReports';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '@/lib/types';

interface Props {
  project: Project;
  reportIndex: number;
}

const STATUS_META: Record<ReportStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', className: 'bg-muted text-muted-foreground', icon: <Clock className="w-3 h-3" /> },
  submitted: { label: 'Soumis', className: 'bg-amber-50 text-amber-700', icon: <Send className="w-3 h-3" /> },
  approved: { label: 'Approuvé', className: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: 'Rejeté', className: 'bg-rose-50 text-rose-700', icon: <XCircle className="w-3 h-3" /> },
  validated: { label: 'Validé', className: 'bg-teal-50 text-teal-700', icon: <ShieldCheck className="w-3 h-3" /> },
};

export default function ReportApprovalPanel({ project, reportIndex }: Props) {
  const { user, role } = useAuth();
  const { activeOrg } = useOrganization();
  const qc = useQueryClient();
  const { reports, submit, approve, reject } = usePeriodicReports(project.id);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const current = useMemo(
    () => reports.find(r => r.report_index === reportIndex),
    [reports, reportIndex]
  );

  const ensure = useMutation({
    mutationFn: async () => {
      if (!user || !activeOrg) throw new Error('Contexte indisponible');
      const r = project.reports?.[reportIndex];
      const { data, error } = await supabase
        .from('periodic_reports')
        .insert({
          project_id: project.id,
          organization_id: activeOrg.id,
          report_index: reportIndex,
          period_start: r?.periodeDebut || null,
          period_end: r?.periodeFin || null,
          status: 'draft',
          depenses: (r?.depenses || {}) as any,
          previsions: (r?.previsions || {}) as any,
          explanation: (r?.explanation || {}) as any,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as PeriodicReport;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periodic-reports'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const isManager = role === 'admin' || role === 'manager';
  const status: ReportStatus = current?.status ?? 'draft';
  const meta = STATUS_META[status];

  const onSubmit = async () => {
    let r = current;
    if (!r) r = await ensure.mutateAsync();
    submit.mutate(r);
  };

  const onApprove = () => current && approve.mutate(current);
  const onReject = () => {
    if (!current || !reason.trim()) return;
    reject.mutate({ report: current, reason: reason.trim() }, {
      onSuccess: () => { setRejectOpen(false); setReason(''); },
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${meta.className}`}>
          {meta.icon} Workflow : {meta.label}
        </span>
        {status === 'rejected' && current?.rejection_reason && (
          <span className="text-xs text-rose-600 italic">Motif : {current.rejection_reason}</span>
        )}
        {current?.submitted_at && (
          <span className="text-[11px] text-muted-foreground font-mono">
            soumis le {new Date(current.submitted_at).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {(status === 'draft' || status === 'rejected') && (
          <Button size="sm" onClick={onSubmit} disabled={submit.isPending || ensure.isPending} className="gap-1.5">
            <Send className="w-3.5 h-3.5" /> Soumettre pour approbation
          </Button>
        )}
        {status === 'submitted' && isManager && (
          <>
            <Button size="sm" variant="default" onClick={onApprove} disabled={approve.isPending} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} className="gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Rejeter
            </Button>
          </>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Motif du rejet</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Expliquez la raison du rejet…" rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={onReject} disabled={!reason.trim() || reject.isPending}>Rejeter</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
