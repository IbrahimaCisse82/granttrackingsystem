import jsPDF from 'jspdf';
import logoUrl from '@/assets/logo-growhub.png';

let cachedLogo: string | null = null;

async function getLogoDataUrl(): Promise<string | null> {
  if (cachedLogo) return cachedLogo;
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    const reader = new FileReader();
    cachedLogo = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return cachedLogo;
  } catch {
    return null;
  }
}

/** Preload logo so synchronous header renders can use it. */
export async function preloadPdfLogo() {
  await getLogoDataUrl();
}

export interface BrandHeaderOptions {
  title: string;
  subtitle?: string;
  organizationName?: string;
  conventionRef?: string;
}

const BRAND_NAME = 'G-GTS — Grant Tracking System';

export function drawBrandHeader(doc: jsPDF, opts: BrandHeaderOptions): number {
  const pageW = doc.internal.pageSize.getWidth();

  // Top brand bar
  doc.setFillColor(0, 91, 153);
  doc.rect(0, 0, pageW, 20, 'F');

  // Logo (if cached)
  if (cachedLogo) {
    try {
      doc.addImage(cachedLogo, 'PNG', 10, 4, 12, 12);
    } catch {
      /* ignore */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND_NAME, cachedLogo ? 26 : 14, 11);

  if (opts.organizationName) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(opts.organizationName, cachedLogo ? 26 : 14, 16);
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (opts.conventionRef) {
    doc.text(`Convention: ${opts.conventionRef}`, pageW - 10, 11, { align: 'right' });
  }
  doc.text(new Date().toLocaleString('fr-FR'), pageW - 10, 16, { align: 'right' });

  // Title block
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.title, 14, 32);

  let y = 38;
  if (opts.subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(opts.subtitle, 14, y);
    y += 6;
  }
  doc.setTextColor(0, 0, 0);
  return y + 2;
}

export function drawFooters(doc: jsPDF, organizationName?: string) {
  const total = doc.getNumberOfPages();
  const generated = new Date().toLocaleString('fr-FR');
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.line(10, pageH - 12, pageW - 10, pageH - 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110);
    const left = organizationName ? `${BRAND_NAME} — ${organizationName}` : BRAND_NAME;
    doc.text(left, 10, pageH - 6);
    doc.text(`Généré le ${generated}`, pageW / 2, pageH - 6, { align: 'center' });
    doc.text(`Page ${i} / ${total}`, pageW - 10, pageH - 6, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
}
