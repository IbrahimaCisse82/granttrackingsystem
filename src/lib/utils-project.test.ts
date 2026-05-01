import { describe, it, expect } from 'vitest';
import { lineTotal, calcBudgetTotal, calcDepensesTotal, fmt, getReportCount, createEmptyReport } from '@/lib/utils-project';
import type { Project, BudgetLine } from '@/lib/types';

describe('utils-project', () => {
  describe('lineTotal', () => {
    it('calcule qty * montant * allocation/100', () => {
      const l: BudgetLine = { id: '1', section: 'A', cat: 'A1', desc: 'x', qty: 2, montant: 100, allocation: 50, frais: 'op' } as any;
      expect(lineTotal(l)).toBe(100); // 2 * 100 * 0.5
    });

    it('renvoie 0 si quantité nulle', () => {
      const l: BudgetLine = { id: '1', section: 'A', cat: 'A1', desc: 'x', qty: 0, montant: 100, allocation: 100, frais: 'op' } as any;
      expect(lineTotal(l)).toBe(0);
    });
  });

  describe('calcBudgetTotal', () => {
    it('somme toutes les lignes', () => {
      const project = {
        budgetLines: [
          { id: '1', section: 'A', qty: 1, montant: 100, allocation: 100 },
          { id: '2', section: 'B', qty: 2, montant: 50, allocation: 100 },
        ],
      } as unknown as Project;
      expect(calcBudgetTotal(project)).toBe(200);
    });

    it('renvoie 0 pour un projet sans lignes', () => {
      const project = { budgetLines: [] } as unknown as Project;
      expect(calcBudgetTotal(project)).toBe(0);
    });
  });

  describe('calcDepensesTotal', () => {
    it('somme toutes les dépenses de tous les rapports', () => {
      const project = {
        reports: [
          { depenses: { '1': 100, '2': 50 } },
          { depenses: { '1': 25 } },
        ],
      } as unknown as Project;
      expect(calcDepensesTotal(project)).toBe(175);
    });
  });

  describe('fmt', () => {
    it('formate avec espaces fr', () => {
      const formatted = fmt(1234567);
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });
  });

  describe('getReportCount', () => {
    it.each([
      ['Mensuelle', 12],
      ['Trimestrielle', 4],
      ['Semestrielle', 2],
      ['Annuelle', 1],
      ['Inconnue', 4],
    ])('renvoie %s -> %i', (period, expected) => {
      expect(getReportCount(period)).toBe(expected);
    });
  });

  describe('createEmptyReport', () => {
    it('crée un rapport vide initialisé', () => {
      const r = createEmptyReport();
      expect(r.status).toBe('vide');
      expect(r.depenses).toEqual({});
      expect(r.transactions).toEqual([]);
    });
  });
});
