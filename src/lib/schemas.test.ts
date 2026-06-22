import { describe, it, expect } from 'vitest';
import {
  projectCreateSchema,
  paymentVoucherSchema,
  fieldReportSchema,
  reportRejectSchema,
  formatZodError,
  RISK_OPTIONS,
  PERIODICITE_OPTIONS,
} from './schemas';

const validProject = {
  convention: 'CONV-2024-001',
  org: 'ONG Test',
  orgType: 'ONG',
  title: 'Projet test',
  pays: 'Sénégal',
  devise: 'FCFA',
  currency: 'XOF',
  taux: 655.957,
  risque: 'Faible risque' as const,
  debut: '2024-01-01',
  fin: '2024-12-31',
  periodicite: 'Trimestrielle' as const,
};

describe('projectCreateSchema', () => {
  it('accepte un projet valide complet', () => {
    const r = projectCreateSchema.safeParse(validProject);
    expect(r.success).toBe(true);
  });

  it('accepte les champs optionnels vides', () => {
    const r = projectCreateSchema.safeParse({
      ...validProject,
      orgType: '',
      pays: '',
      risque: '',
      debut: '',
      fin: '',
      periodicite: '',
    });
    expect(r.success).toBe(true);
  });

  describe('convention', () => {
    it('rejette une convention vide', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, convention: '' });
      expect(r.success).toBe(false);
      if (!r.success) expect(formatZodError(r.error)).toMatch(/Convention requis/i);
    });
    it('rejette une convention de plus de 50 caractères', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, convention: 'X'.repeat(51) });
      expect(r.success).toBe(false);
      if (!r.success) expect(formatZodError(r.error)).toMatch(/50 caractères/);
    });
    it('trim les espaces', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, convention: '   ' });
      expect(r.success).toBe(false);
    });
  });

  describe('org', () => {
    it('rejette une organisation vide', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, org: '' });
      expect(r.success).toBe(false);
      if (!r.success) expect(formatZodError(r.error)).toMatch(/Organisation requise/i);
    });
    it('rejette une organisation de plus de 100 caractères', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, org: 'X'.repeat(101) });
      expect(r.success).toBe(false);
    });
  });

  describe('title', () => {
    it('rejette un titre vide', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, title: '' });
      expect(r.success).toBe(false);
      if (!r.success) expect(formatZodError(r.error)).toMatch(/Titre requis/i);
    });
    it('rejette un titre de plus de 200 caractères', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, title: 'X'.repeat(201) });
      expect(r.success).toBe(false);
    });
  });

  describe('taux', () => {
    it('rejette un taux négatif', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, taux: -1 });
      expect(r.success).toBe(false);
      if (!r.success) expect(formatZodError(r.error)).toMatch(/Taux doit être > 0/);
    });
    it('rejette un taux nul', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, taux: 0 });
      expect(r.success).toBe(false);
    });
    it('rejette un taux non numérique', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, taux: 'abc' as unknown as number });
      expect(r.success).toBe(false);
      if (!r.success) expect(formatZodError(r.error)).toMatch(/Taux/);
    });
    it('coerce un taux fourni en string', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, taux: '123.45' as unknown as number });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.taux).toBe(123.45);
    });
    it('rejette un taux trop élevé', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, taux: 2_000_000 });
      expect(r.success).toBe(false);
    });
  });

  describe('dates', () => {
    it('rejette un format de date invalide', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, debut: '01/01/2024' });
      expect(r.success).toBe(false);
      if (!r.success) expect(formatZodError(r.error)).toMatch(/Date invalide/);
    });
    it('rejette une date de fin antérieure à la date de début', () => {
      const r = projectCreateSchema.safeParse({
        ...validProject,
        debut: '2024-12-31',
        fin: '2024-01-01',
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(formatZodError(r.error)).toMatch(/fin doit être après/i);
        expect(r.error.issues[0].path).toContain('fin');
      }
    });
    it('accepte début == fin', () => {
      const r = projectCreateSchema.safeParse({
        ...validProject,
        debut: '2024-06-01',
        fin: '2024-06-01',
      });
      expect(r.success).toBe(true);
    });
    it('accepte une seule date renseignée', () => {
      const r1 = projectCreateSchema.safeParse({ ...validProject, debut: '2024-01-01', fin: '' });
      const r2 = projectCreateSchema.safeParse({ ...validProject, debut: '', fin: '2024-12-31' });
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
    });
  });

  describe('enums', () => {
    it.each(RISK_OPTIONS)('accepte le risque "%s"', (risk) => {
      const r = projectCreateSchema.safeParse({ ...validProject, risque: risk });
      expect(r.success).toBe(true);
    });
    it('rejette un risque hors enum', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, risque: 'Inconnu' as never });
      expect(r.success).toBe(false);
    });
    it.each(PERIODICITE_OPTIONS)('accepte la périodicité "%s"', (p) => {
      const r = projectCreateSchema.safeParse({ ...validProject, periodicite: p });
      expect(r.success).toBe(true);
    });
    it('rejette une périodicité hors enum', () => {
      const r = projectCreateSchema.safeParse({ ...validProject, periodicite: 'Hebdo' as never });
      expect(r.success).toBe(false);
    });
  });

  it('cumule plusieurs erreurs', () => {
    const r = projectCreateSchema.safeParse({
      ...validProject,
      convention: '',
      org: '',
      title: '',
      taux: -5,
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.length).toBeGreaterThanOrEqual(4);
  });
});

describe('paymentVoucherSchema', () => {
  const valid = {
    voucher_number: 'V-001',
    amount_local: 1000,
    currency: 'XOF',
    exchange_rate: 655.957,
    payment_date: '2024-06-15',
  };

  it('accepte une fiche valide', () => {
    expect(paymentVoucherSchema.safeParse(valid).success).toBe(true);
  });
  it('rejette un numéro vide', () => {
    const r = paymentVoucherSchema.safeParse({ ...valid, voucher_number: '' });
    expect(r.success).toBe(false);
  });
  it('rejette un montant négatif', () => {
    const r = paymentVoucherSchema.safeParse({ ...valid, amount_local: -10 });
    expect(r.success).toBe(false);
  });
  it('rejette une date au mauvais format', () => {
    const r = paymentVoucherSchema.safeParse({ ...valid, payment_date: '15-06-2024' });
    expect(r.success).toBe(false);
  });
});

describe('fieldReportSchema', () => {
  const valid = {
    project_id: '00000000-0000-0000-0000-000000000001',
    period_start: '2024-01-01',
    period_end: '2024-03-31',
    narrative: 'Narratif suffisamment long pour passer la validation.',
  };

  it('accepte un rapport valide', () => {
    expect(fieldReportSchema.safeParse(valid).success).toBe(true);
  });
  it('rejette un project_id non-UUID', () => {
    const r = fieldReportSchema.safeParse({ ...valid, project_id: 'abc' });
    expect(r.success).toBe(false);
  });
  it('rejette un narratif trop court', () => {
    const r = fieldReportSchema.safeParse({ ...valid, narrative: 'court' });
    expect(r.success).toBe(false);
  });
  it('rejette des périodes inversées', () => {
    const r = fieldReportSchema.safeParse({
      ...valid,
      period_start: '2024-12-31',
      period_end: '2024-01-01',
    });
    expect(r.success).toBe(false);
  });
});

describe('reportRejectSchema', () => {
  it('rejette un motif trop court', () => {
    expect(reportRejectSchema.safeParse({ reason: 'no' }).success).toBe(false);
  });
  it('accepte un motif suffisant', () => {
    expect(reportRejectSchema.safeParse({ reason: 'Motif valable' }).success).toBe(true);
  });
});

describe('formatZodError', () => {
  it('concatène plusieurs messages avec un séparateur', () => {
    const r = projectCreateSchema.safeParse({ ...validProject, convention: '', org: '' });
    if (r.success) throw new Error('expected failure');
    const msg = formatZodError(r.error);
    expect(msg).toMatch(/Convention/);
    expect(msg).toMatch(/Organisation/);
    expect(msg).toContain(' • ');
  });
});
