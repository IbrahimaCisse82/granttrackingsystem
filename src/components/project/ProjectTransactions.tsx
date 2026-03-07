import { Project, Transaction, Attachment, fmt } from '@/lib/mock-data';
import MetricCard from '@/components/MetricCard';
import { useCallback, useRef, useState } from 'react';
import { Trash2, Paperclip, Upload, X, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  project: Project;
  reportIndex: number;
  onSave: (partial: Partial<Project>) => void;
}

export default function ProjectTransactions({ project, reportIndex, onSave }: Props) {
  const report = project.reports?.[reportIndex];
  const transactions = report?.transactions || [];
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTxId, setActiveUploadTxId] = useState<string | null>(null);

  const updateTransactions = useCallback((newTx: Transaction[]) => {
    if (!report) return;
    const newReports = [...project.reports];
    newReports[reportIndex] = { ...newReports[reportIndex], transactions: newTx };
    onSave({ reports: newReports });
  }, [project.reports, reportIndex, onSave, report]);

  const addTransaction = useCallback(() => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      code: '',
      date: new Date().toISOString().slice(0, 10),
      voucher: '',
      beneficiaire: '',
      montantDevise: 0,
      tauxChange: project.taux,
      montantEUR: 0,
      description: '',
      attachments: [],
    };
    updateTransactions([...transactions, newTx]);
  }, [transactions, updateTransactions, project.taux]);

  const updateTx = useCallback((index: number, patch: Partial<Transaction>) => {
    const newTx = transactions.map((t, i) => {
      if (i !== index) return t;
      const updated = { ...t, ...patch };
      if (patch.montantDevise !== undefined || patch.tauxChange !== undefined) {
        const devise = patch.montantDevise !== undefined ? patch.montantDevise : t.montantDevise;
        const taux = patch.tauxChange !== undefined ? patch.tauxChange : t.tauxChange;
        updated.montantEUR = taux > 0 ? Math.round((devise / taux) * 100) / 100 : 0;
      }
      return updated;
    });
    updateTransactions(newTx);
  }, [transactions, updateTransactions]);

  const removeTx = useCallback((index: number) => {
    updateTransactions(transactions.filter((_, i) => i !== index));
  }, [transactions, updateTransactions]);

  const handleUploadClick = (txId: string) => {
    setActiveUploadTxId(txId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeUploadTxId) return;

    const txIndex = transactions.findIndex(t => t.id === activeUploadTxId);
    if (txIndex === -1) return;

    setUploading(activeUploadTxId);

    try {
      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} dépasse 10 Mo`);
          continue;
        }

        const ext = file.name.split('.').pop();
        const path = `${project.id}/${reportIndex}/${activeUploadTxId}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from('transaction-attachments')
          .upload(path, file);

        if (error) {
          toast.error(`Erreur upload ${file.name}: ${error.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('transaction-attachments')
          .getPublicUrl(path);

        newAttachments.push({
          name: file.name,
          url: urlData.publicUrl,
          path,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (newAttachments.length > 0) {
        const tx = transactions[txIndex];
        const existingAttachments = tx.attachments || [];
        updateTx(txIndex, { attachments: [...existingAttachments, ...newAttachments] });
        toast.success(`${newAttachments.length} fichier(s) ajouté(s)`);
      }
    } catch (err) {
      toast.error('Erreur lors du téléversement');
    } finally {
      setUploading(null);
      setActiveUploadTxId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = async (txIndex: number, attIndex: number) => {
    const tx = transactions[txIndex];
    const att = tx.attachments?.[attIndex];
    if (!att) return;

    const { error } = await supabase.storage
      .from('transaction-attachments')
      .remove([att.path]);

    if (error) {
      toast.error('Erreur suppression fichier');
      return;
    }

    const newAttachments = [...(tx.attachments || [])];
    newAttachments.splice(attIndex, 1);
    updateTx(txIndex, { attachments: newAttachments });
    toast.success('Fichier supprimé');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  if (!report) return <p className="p-8 text-muted-foreground">Rapport non disponible.</p>;

  const n = reportIndex + 1;
  const totalEUR = transactions.reduce((s, t) => s + (t.montantEUR || 0), 0);
  const totalDepenses = Object.values(report.depenses || {}).reduce((s, v) => s + v, 0);
  const variance = totalDepenses - totalEUR;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Liste des transactions — REP {String(n).padStart(2, '0')}</h1>
          <p className="text-xs text-muted-foreground mt-1">{project.org} · {transactions.length} transaction(s)</p>
        </div>
        <button onClick={addTransaction} className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 transition-all">
          + Ajouter
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        <MetricCard label="Total transactions" value={String(transactions.length)} accentColor="emerald" />
        <MetricCard label="Total EUR" value={`${fmt(totalEUR)} €`} accentColor="blue" />
        <MetricCard label="Variance vs Rapport" value={`${fmt(variance)} €`} note={Math.abs(variance) < 0.01 ? 'OK — concordant' : 'Écart à corriger'} accentColor={Math.abs(variance) < 0.01 ? 'emerald' : 'rose'} />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-ink-2">
                {['#', 'Code budget.', 'Date', 'N° Voucher', 'Bénéficiaire', 'Montant devise', 'Taux', 'Montant EUR', 'Description', 'Pièces', ''].map(h => (
                  <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map((t, i) => (
                <tr key={t.id} className="hover:bg-paper/50 transition-colors group">
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-mono text-[11px] text-dim">{i + 1}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <select value={t.code} onChange={e => updateTx(i, { code: e.target.value })}
                      className="font-mono text-[10.5px] font-semibold bg-enabel-light text-enabel-dark rounded px-1.5 py-0.5 outline-none border-none">
                      <option value="">—</option>
                      {project.budgetLines.map(bl => <option key={bl.code} value={bl.code}>{bl.code}</option>)}
                    </select>
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="date" defaultValue={t.date} key={t.date} onChange={e => updateTx(i, { date: e.target.value })}
                      className="w-full bg-transparent font-mono text-xs outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="text" defaultValue={t.voucher} key={t.voucher} onChange={e => updateTx(i, { voucher: e.target.value })}
                      className="w-full bg-transparent font-mono text-xs outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="text" defaultValue={t.beneficiaire} key={t.beneficiaire} onChange={e => updateTx(i, { beneficiaire: e.target.value })}
                      className="w-full bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="number" defaultValue={t.montantDevise} key={`d-${t.montantDevise}`} onChange={e => updateTx(i, { montantDevise: Number(e.target.value) || 0 })}
                      className="w-24 text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="number" defaultValue={t.tauxChange} key={`t-${t.tauxChange}`} onChange={e => updateTx(i, { tauxChange: Number(e.target.value) || 0 })}
                      className="w-20 text-right font-mono bg-transparent outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono font-semibold text-primary">
                    {fmt(t.montantEUR)} €
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <input type="text" defaultValue={t.description} key={t.description} onChange={e => updateTx(i, { description: e.target.value })}
                      className="w-full bg-transparent text-muted-foreground outline-none focus:bg-card rounded px-1" />
                  </td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUploadClick(t.id)}
                        disabled={uploading === t.id}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                        title="Ajouter une pièce justificative"
                      >
                        {uploading === t.id ? (
                          <span className="animate-spin w-3.5 h-3.5 border border-primary border-t-transparent rounded-full inline-block" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {(t.attachments?.length || 0) > 0 && (
                        <span className="bg-primary/10 text-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {t.attachments!.length}
                        </span>
                      )}
                    </div>
                    {(t.attachments?.length || 0) > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {t.attachments!.map((att, ai) => (
                          <div key={ai} className="flex items-center gap-1 text-[9px] bg-muted/50 rounded px-1.5 py-0.5 group/att">
                            <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                            <a href={att.url} target="_blank" rel="noopener noreferrer"
                              className="truncate max-w-[80px] hover:text-primary transition-colors" title={att.name}>
                              {att.name}
                            </a>
                            <span className="text-muted-foreground shrink-0">({formatSize(att.size)})</span>
                            <button onClick={() => removeAttachment(i, ai)}
                              className="opacity-0 group-hover/att:opacity-100 text-destructive hover:text-destructive/80 transition-all shrink-0 ml-auto">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-rule-2 px-3 py-2.5">
                    <button onClick={() => removeTx(i)} className="opacity-0 group-hover:opacity-100 text-dim hover:text-rose transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-dim italic">Aucune transaction. Cliquez sur "+ Ajouter".</td>
                </tr>
              )}
              <tr className="bg-ink text-sidebar-foreground font-mono font-bold text-xs">
                <td colSpan={7} className="px-3 py-2">TOTAL</td>
                <td className="px-3 py-2 text-right">{fmt(totalEUR)} €</td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
