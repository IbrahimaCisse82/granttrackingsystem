import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DashboardMetrics } from '@/hooks/useDashboardMetrics';
import { fmt } from '@/lib/utils-project';
import { drawBrandHeader, drawFooters, preloadPdfLogo } from '@/lib/pdf-branding';

export async function exportDashboardPDF(
  metrics: DashboardMetrics,
  filters: { pays?: string; periodicite?: string },
  organizationName?: string,
) {
  await preloadPdfLogo();
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const filterParts: string[] = [];
  if (filters.pays) filterParts.push(`Pays: ${filters.pays}`);
  if (filters.periodicite) filterParts.push(`Périodicité: ${filters.periodicite}`);
  const subtitle = filterParts.length ? `Filtres — ${filterParts.join(' | ')}` : 'Tous les projets';

  let y = drawBrandHeader(doc, {
    title: 'Tableau de bord — Métriques consolidées',
    subtitle,
    organizationName,
  });

  const taux = metrics.totalBudget > 0
    ? Math.round((metrics.totalDepenses / metrics.totalBudget) * 100)
    : 0;

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Projets actifs', String(metrics.totalProjects)],
      ['Budget total', `${fmt(metrics.totalBudget)} €`],
      ['Dépenses engagées', `${fmt(metrics.totalDepenses)} €`],
      ['Taux de consommation', `${taux} %`],
      ['Rapports validés', String(metrics.totalRapports)],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { bottom: 16 },
  });

  const renderTable = (title: string, head: string[][], body: any[][]) => {
    const last = (doc as any).lastAutoTable?.finalY ?? y;
    let startY = last + 8;
    if (startY > 250) {
      doc.addPage();
      startY = drawBrandHeader(doc, { title: 'Tableau de bord (suite)', subtitle, organizationName });
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, startY);
    autoTable(doc, {
      startY: startY + 3,
      head,
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      margin: { bottom: 16 },
    });
  };

  if (metrics.budgetByProject.length) {
    renderTable('Budget vs Dépenses par projet', [['Projet', 'Budget €', 'Dépenses €']],
      metrics.budgetByProject.map(d => [d.name, `${fmt(d.budget)}`, `${fmt(d.depenses)}`]));
  }
  if (metrics.sectionData.length) {
    renderTable('Répartition budgétaire par section', [['Section', 'Montant €']],
      metrics.sectionData.map(d => [d.name, `${fmt(d.value)}`]));
  }
  if (metrics.bailleurData.length) {
    renderTable('Répartition par bailleur', [['Bailleur', 'Montant €']],
      metrics.bailleurData.map(d => [d.name, `${fmt(d.value)}`]));
  }
  if (metrics.riskData.length) {
    renderTable('Distribution des risques', [['Niveau de risque', 'Nombre de projets']],
      metrics.riskData.map(d => [d.name, String(d.value)]));
  }
  if (metrics.timelineData.length) {
    renderTable('Évolution des dépenses', [['Période', 'Dépenses €']],
      metrics.timelineData.map(d => [d.periode, `${fmt(d.depenses)}`]));
  }

  drawFooters(doc, organizationName);
  doc.save(`dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export interface PortfolioExportRow {
  convention: string;
  org: string;
  title: string;
  pays: string;
  risque: string;
  debut: string;
  fin: string;
  budget: number;
  depenses: number;
  taux: number;
}

export async function exportPortfolioPDF(
  rows: PortfolioExportRow[],
  meta: {
    search?: string;
    risque?: string;
    pays?: string;
    archived?: boolean;
    sortBy?: string;
    sortDir?: string;
  },
  organizationName?: string,
) {
  await preloadPdfLogo();
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const parts: string[] = [];
  if (meta.search) parts.push(`Recherche: "${meta.search}"`);
  if (meta.risque) parts.push(`Risque: ${meta.risque}`);
  if (meta.pays) parts.push(`Pays: ${meta.pays}`);
  parts.push(meta.archived ? 'Archivés' : 'Actifs');
  if (meta.sortBy) parts.push(`Tri: ${meta.sortBy} ${meta.sortDir ?? ''}`);
  const subtitle = parts.join(' | ');

  let y = drawBrandHeader(doc, {
    title: `Portefeuille — ${rows.length} projet(s)`,
    subtitle,
    organizationName,
  });

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalDep = rows.reduce((s, r) => s + r.depenses, 0);

  autoTable(doc, {
    startY: y,
    head: [['Convention', 'Organisation', 'Titre', 'Pays', 'Risque', 'Début', 'Fin', 'Budget €', 'Dépenses €', 'Taux']],
    body: [
      ...rows.map(r => [
        r.convention, r.org, r.title, r.pays, r.risque,
        r.debut || '—', r.fin || '—',
        fmt(r.budget), fmt(r.depenses), `${r.taux}%`,
      ]),
      [
        { content: 'TOTAL', colSpan: 7, styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255, 255, 255] } },
        { content: fmt(totalBudget), styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255, 255, 255], halign: 'right' } },
        { content: fmt(totalDep), styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255, 255, 255], halign: 'right' } },
        { content: totalBudget > 0 ? `${Math.round(totalDep / totalBudget * 100)}%` : '—', styles: { fontStyle: 'bold', fillColor: [30, 41, 59], textColor: [255, 255, 255], halign: 'right' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7.5 },
    columnStyles: { 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } },
    margin: { bottom: 16 },
  });

  drawFooters(doc, organizationName);
  doc.save(`portefeuille-${new Date().toISOString().slice(0, 10)}.pdf`);
}
