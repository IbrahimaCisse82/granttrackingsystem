import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '@/lib/types';
import { lineTotal, fmt, fmtFCFA, EUR_TO_FCFA, getReportCount } from '@/lib/utils-project';

function addHeader(doc: jsPDF, project: Project, title: string) {
  const pageW = doc.internal.pageSize.getWidth();
  
  // Top bar
  doc.setFillColor(0, 91, 153); // primary
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('GROW HUB SARL — Grants Tracking System', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Convention: ${project.convention}`, pageW - 14, 8, { align: 'right' });
  doc.text(`Organisation: ${project.org}`, pageW - 14, 13, { align: 'right' });

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 30);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Projet: ${project.title} | Pays: ${project.pays} | Devise: ${project.devise}`, 14, 36);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 41);

  return 48; // Y position after header
}

export function exportBudgetPDF(project: Project) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  let y = addHeader(doc, project, 'Budget — Annexe 1b');

  // Info line
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Taux de conversion: 1 EUR = ${fmtFCFA(EUR_TO_FCFA)} FCFA`, 14, y);
  y += 6;

  const linesA = project.budgetLines.filter(l => l.section === 'A');
  const linesB = project.budgetLines.filter(l => l.section === 'B');
  const totalA = linesA.reduce((s, l) => s + lineTotal(l), 0);
  const totalB = linesB.reduce((s, l) => s + lineTotal(l), 0);

  const buildRows = (lines: typeof linesA) => lines.map(l => {
    const tot = lineTotal(l);
    return [l.code, l.desc, l.unite, String(l.qty), `${fmtFCFA(l.montant * EUR_TO_FCFA)}`, `${l.allocation}%`, `${fmtFCFA(tot * EUR_TO_FCFA)} F`, `${fmt(tot)} €`];
  });

  const head = [['Code', 'Poste budgétaire', 'Unité', 'Qté', 'Montant FCFA', 'Alloc.', 'Total FCFA', 'Total EUR']];

  // Section A
  autoTable(doc, {
    startY: y,
    head,
    body: [
      [{ content: 'A — COÛTS OPÉRATIONNELS', colSpan: 8, styles: { fillColor: [207, 226, 243], textColor: [0, 91, 153], fontStyle: 'bold', fontSize: 8 } }],
      ...buildRows(linesA),
      [{ content: 'SOUS-TOTAL A', colSpan: 6, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255,255,255] } }, 
       { content: `${fmtFCFA(totalA * EUR_TO_FCFA)} F`, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255,255,255], halign: 'right' } },
       { content: `${fmt(totalA)} €`, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255,255,255], halign: 'right' } }],
      [{ content: 'B — FRAIS DE GESTION', colSpan: 8, styles: { fillColor: [254, 243, 199], textColor: [180, 83, 9], fontStyle: 'bold', fontSize: 8 } }],
      ...buildRows(linesB),
      [{ content: 'SOUS-TOTAL B', colSpan: 6, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255,255,255] } },
       { content: `${fmtFCFA(totalB * EUR_TO_FCFA)} F`, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255,255,255], halign: 'right' } },
       { content: `${fmt(totalB)} €`, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255,255,255], halign: 'right' } }],
      [{ content: 'TOTAL GÉNÉRAL', colSpan: 6, styles: { fontStyle: 'bold', fillColor: [0, 91, 153], textColor: [255,255,255], fontSize: 9 } },
       { content: `${fmtFCFA((totalA + totalB) * EUR_TO_FCFA)} F`, styles: { fontStyle: 'bold', fillColor: [0, 91, 153], textColor: [255,255,255], halign: 'right', fontSize: 9 } },
       { content: `${fmt(totalA + totalB)} €`, styles: { fontStyle: 'bold', fillColor: [0, 91, 153], textColor: [255,255,255], halign: 'right', fontSize: 9 } }],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
  });

  doc.save(`${project.convention}-budget.pdf`);
}

export function exportReportPDF(project: Project, reportIndex: number) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const report = project.reports[reportIndex];
  if (!report) return;

  const n = String(reportIndex + 1).padStart(3, '0');
  let y = addHeader(doc, project, `Rapport Financier N° ${n}`);

  // Period info
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(`Période: ${report.periodeDebut || '—'} → ${report.periodeFin || '—'} | Soumis le: ${report.dateSubmit || '—'} | Statut: ${report.status}`, 14, y);
  y += 6;

  const head = [['Code', 'Poste budgétaire', 'Budget total', 'Cumul antérieur', 'Dépenses période', 'Cumul total', 'Solde €', 'Explication']];
  
  const rows = project.budgetLines.map(l => {
    const bud = lineTotal(l);
    const prevDep = project.reports.slice(0, reportIndex).reduce((s, r) => s + ((r.depenses || {})[l.code] || 0), 0);
    const dep = (report.depenses || {})[l.code] || 0;
    const cumul = prevDep + dep;
    const solde = bud - cumul;
    return [l.code, l.desc, `${fmt(bud)} €`, `${fmt(prevDep)} €`, `${fmt(dep)} €`, `${fmt(cumul)} €`, `${fmt(solde)} €`, report.explanation?.[l.code] || ''];
  });

  autoTable(doc, {
    startY: y,
    head,
    body: rows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5 },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
  });

  doc.save(`${project.convention}-rapport-${n}.pdf`);
}

export function exportTransactionsPDF(project: Project, reportIndex: number) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const report = project.reports[reportIndex];
  if (!report) return;

  const n = String(reportIndex + 1).padStart(2, '0');
  let y = addHeader(doc, project, `Transactions — REP ${n}`);

  const head = [['#', 'Code', 'Date', 'N° Voucher', 'Bénéficiaire', `Montant ${project.devise}`, 'Taux', 'Montant EUR', 'Description']];
  const rows = report.transactions.map((t, i) => [
    String(i + 1), t.code, t.date, t.voucher, t.beneficiaire,
    fmt(t.montantDevise), String(t.tauxChange), `${fmt(t.montantEUR)} €`, t.description,
  ]);

  const totalEUR = report.transactions.reduce((s, t) => s + t.montantEUR, 0);

  autoTable(doc, {
    startY: y,
    head,
    body: [
      ...rows,
      [{ content: 'TOTAL', colSpan: 7, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255,255,255] } },
       { content: `${fmt(totalEUR)} €`, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255,255,255], halign: 'right' } },
       { content: '', styles: { fillColor: [30, 41, 59] } }],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5 },
    columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
  });

  doc.save(`${project.convention}-transactions-rep${n}.pdf`);
}
