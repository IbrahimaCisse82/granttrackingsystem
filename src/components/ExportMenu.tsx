import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ExportHandlers {
  /** Returns a Blob URL or triggers download itself */
  pdf?: () => Promise<string | void> | string | void;
  excel?: () => Promise<void> | void;
  json?: () => Promise<void> | void;
}

interface Props {
  handlers: ExportHandlers;
  label?: string;
  /** Hint shown about active filters */
  filtersHint?: string;
}

export function ExportMenu({ handlers, label = 'Exporter', filtersHint }: Props) {
  const { role } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => unknown) => {
    try {
      setBusy(true);
      await fn();
    } catch (e) {
      toast.error('Échec de l\'export', { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handlePdf = async () => {
    if (!handlers.pdf) return;
    await run(async () => {
      const result = await handlers.pdf!();
      if (typeof result === 'string') setPreviewUrl(result);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={busy}>
            <Download className="w-4 h-4 mr-2" /> {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {filtersHint && (
            <div className="px-2 py-1.5 text-[10px] text-muted-foreground border-b">{filtersHint}</div>
          )}
          {handlers.pdf && (
            <DropdownMenuItem onClick={handlePdf}>
              <FileText className="w-4 h-4 mr-2" /> PDF (aperçu)
            </DropdownMenuItem>
          )}
          {handlers.excel && (
            <DropdownMenuItem onClick={() => run(handlers.excel!)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
            </DropdownMenuItem>
          )}
          {handlers.json && role === 'admin' && (
            <DropdownMenuItem onClick={() => run(handlers.json!)}>
              <FileJson className="w-4 h-4 mr-2" /> JSON (admin)
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="w-4 h-4" /> Aperçu PDF</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe src={previewUrl} className="flex-1 w-full rounded border" title="Aperçu PDF" />
          )}
          <DialogFooter>
            {previewUrl && (
              <a href={previewUrl} download className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">
                <Download className="w-4 h-4" /> Télécharger
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
