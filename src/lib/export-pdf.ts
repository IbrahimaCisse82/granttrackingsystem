import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '@/lib/types';
import { lineTotal, fmt, fmtFCFA, EUR_TO_FCFA } from '@/lib/utils-project';
import { drawBrandHeader, drawFooters, preloadPdfLogo } from '@/lib/pdf-branding';

function header(doc: jsPDF, project: Project, title: string) {
  return drawBrandHeader(doc, {
    title,
    subtitle: `Projet: ${project.title} | Pays: ${project.pays} | Devise: ${project.devise}`,
    organizationName: project.org,
    conventionRef: project.convention,
  });
}

export async function exportBudgetPDF(project: Project) {
  await preloadPdfLogo();
  const doc = new jsPDF('landscape', 'mm', 'a4');
  let y = header(doc, project, 'Budget — Annexe 1b');

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Taux de conversion: 1 EUR = ${fmtFCFA(EUR_TO_FCFA)} FCFA`, 14, y);
  y += 4;

  const linesA = project.budgetLines.filter(l => l.section === 'A');
  const linesB = project.budgetLines.filter(l => l.section === 'B');
  const totalA = linesA.reduce((s, l) => s + lineTotal(l), 0);
  const totalB = linesB.reduce((s, l) => s + lineTotal(l), 0);

  const buildRows = (lines: typeof linesA) => lines.map(l => {
    const tot = lineTotal(l);
    return [l.code, l.desc, l.unite, String(l.qty), `${fmtFCFA(l.montant * EUR_TO_FCFA)}`, `${l.allocation}%`, `${fmtFCFA(tot * EUR_TO_FCFA)} F`, `${fmt(tot)} €`];
  });

  const head = [['Code', 'Poste budgétaire', 'Unité', 'Qté', 'Montant FCFA', 'Alloc.', 'Total FCFA', 'Total EUR']];

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
    margin: { bottom: 16 },
  });

  drawFooters(doc, project.org);
  doc.save(`${project.convention}-budget.pdf`);
}

export async function exportReportPDF(project: Project, reportIndex: number) {
  await preloadPdfLogo();
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const report = project.reports[reportIndex];
  if (!report) return;

  const n = String(reportIndex + 1).padStart(3, '0');
  let y = header(doc, project, `Rapport Financier N° ${n}`);

  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(`Période: ${report.periodeDebut || '—'} → ${report.periodeFin || '—'} | Soumis le: ${report.dateSubmit || '—'} | Statut: ${report.status}`, 14, y);
  y += 4;

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
    margin: { bottom: 16 },
  });

  drawFooters(doc, project.org);
  doc.save(`${project.convention}-rapport-${n}.pdf`);
}

export async function exportTransactionsPDF(project: Project, reportIndex: number) {
  await preloadPdfLogo();
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const report = project.reports[reportIndex];
  if (!report) return;

  const n = String(reportIndex + 1).padStart(2, '0');
  let y = header(doc, project, `Transactions — REP ${n}`);

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
    margin: { bottom: 16 },
  });

  drawFooters(doc, project.org);
  doc.save(`${project.convention}-transactions-rep${n}.pdf`);
}
