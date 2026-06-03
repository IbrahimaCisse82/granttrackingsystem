import { z } from 'zod';

// ---------- Helpers ----------
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)');

const optionalIsoDate = z.union([isoDate, z.literal('')]).optional();

// ---------- Project (création) ----------
export const RISK_OPTIONS = [
  'Faible risque',
  'Risque modéré',
  'Risque important',
  'Risque élevé',
] as const;

export const PERIODICITE_OPTIONS = [
  'Mensuelle',
  'Trimestrielle',
  'Semestrielle',
  'Annuelle',
] as const;

export const projectCreateSchema = z
  .object({
    convention: z
      .string()
      .trim()
      .min(1, 'N° Convention requis')
      .max(50, '50 caractères maximum'),
    org: z
      .string()
      .trim()
      .min(1, 'Organisation requise')
      .max(100, '100 caractères maximum'),
    orgType: z.string().trim().max(50).optional().default(''),
    title: z
      .string()
      .trim()
      .min(1, 'Titre requis')
      .max(200, '200 caractères maximum'),
    pays: z.string().trim().max(50).optional().default(''),
    devise: z.string().trim().min(1).max(10),
    currency: z.string().trim().min(1).max(10),
    taux: z.coerce
      .number({ invalid_type_error: 'Taux invalide' })
      .positive('Taux doit être > 0')
      .max(1_000_000, 'Taux trop élevé'),
    risque: z.union([z.enum(RISK_OPTIONS), z.literal('')]).optional(),
    debut: optionalIsoDate,
    fin: optionalIsoDate,
    periodicite: z
      .union([z.enum(PERIODICITE_OPTIONS), z.literal('')])
      .optional(),
  })
  .refine(
    (v) => !v.debut || !v.fin || v.debut <= v.fin,
    { message: 'La date de fin doit être après la date de début', path: ['fin'] },
  );

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

// ---------- Payment Voucher (fiche de versement) ----------
export const VOUCHER_STATUSES = ['pending', 'received', 'reconciled'] as const;

export const paymentVoucherSchema = z.object({
  voucher_number: z
    .string()
    .trim()
    .min(1, 'N° de fiche requis')
    .max(50, '50 caractères maximum'),
  amount_local: z.coerce
    .number({ invalid_type_error: 'Montant invalide' })
    .positive('Montant doit être > 0')
    .max(1e12, 'Montant trop élevé'),
  currency: z.string().trim().min(1, 'Devise requise').max(10),
  exchange_rate: z.coerce
    .number({ invalid_type_error: 'Taux invalide' })
    .positive('Taux doit être > 0')
    .max(1_000_000, 'Taux trop élevé'),
  payment_date: isoDate,
  donor_reference: z.string().trim().max(100).optional().default(''),
  bank_reference: z.string().trim().max(100).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
});

export type PaymentVoucherInput = z.infer<typeof paymentVoucherSchema>;

// ---------- Field Report (rapport terrain) ----------
export const fieldReportSchema = z
  .object({
    project_id: z.string().uuid('Projet requis'),
    period_start: isoDate,
    period_end: isoDate,
    narrative: z
      .string()
      .trim()
      .min(20, 'Narratif trop court (20 caractères minimum)')
      .max(20_000, 'Narratif trop long'),
  })
  .refine((v) => v.period_start <= v.period_end, {
    message: 'La date de fin doit être après la date de début',
    path: ['period_end'],
  });

export type FieldReportInput = z.infer<typeof fieldReportSchema>;

// ---------- Periodic Report (rejet) ----------
export const reportRejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Motif requis (5 caractères minimum)')
    .max(2000, '2000 caractères maximum'),
});

// ---------- Util: formater les erreurs Zod ----------
export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => i.message).join(' • ');
}
