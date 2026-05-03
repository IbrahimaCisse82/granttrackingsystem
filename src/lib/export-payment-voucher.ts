import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawBrandHeader, drawFooters, preloadPdfLogo } from './pdf-branding';
import { fmt } from './utils-project';
import type { PaymentVoucher } from '@/hooks/usePaymentVouchers';
import type { Project } from './types';

export async function exportPaymentVoucherPDF(v: PaymentVoucher, project: Project, orgName?: string) {
  await preloadPdfLogo();
  const doc = new jsPDF();
  const startY = drawBrandHeader(doc, {
    title: `Fiche de versement ${v.voucher_number}`,
    subtitle: project.title,
    organizationName: orgName,
    conventionRef: project.convention,
  });

  autoTable(doc, {
    startY: startY + 6,
    head: [['Champ', 'Valeur']],
    body: [
      ['N° Fiche', v.voucher_number],
      ['Projet', `${project.title} (${project.convention})`],
      ['Date de paiement', v.payment_date],
      ['Montant', `${fmt(v.amount_local)} ${v.currency}`],
      ['Taux de change', String(v.exchange_rate ?? '—')],
      ['Montant EUR', `${fmt(v.amount_eur || 0)} €`],
      ['Référence bailleur', v.donor_reference || '—'],
      ['Référence bancaire', v.bank_reference || '—'],
      ['Statut', v.status],
      ['Notes', v.notes || '—'],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [0, 91, 153], textColor: 255 },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } },
  });

  drawFooters(doc);
  doc.save(`fiche-versement-${v.voucher_number}.pdf`);
}
