CREATE TABLE IF NOT EXISTS public.glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term varchar(100) NOT NULL UNIQUE,
  definition text NOT NULL,
  module varchar(50),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read glossary"
  ON public.glossary FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage glossary"
  ON public.glossary FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.glossary (term, definition, module) VALUES
  ('Bailleur', 'Organisation qui finance tout ou partie d''un projet (fondation, agence de coopération, État, etc.).', 'project'),
  ('Convention', 'Document contractuel signé entre l''organisation et le bailleur, fixant le montant, la durée et les obligations du financement.', 'project'),
  ('Voucher', 'Pièce justificative interne (facture, reçu, ordre de paiement) liée à une transaction.', 'transactions'),
  ('Fiche de versement', 'Document attestant le versement d''une tranche de financement par le bailleur, avec montants, références bancaires et statut.', 'reports'),
  ('Sous-récipiendaire', 'Organisation partenaire qui reçoit une partie des fonds via le récipiendaire principal pour exécuter une activité.', 'project'),
  ('Ligne budgétaire', 'Élément détaillé du budget (poste, quantité, coût unitaire, allocation) regroupé par section A (opérationnel) ou B (gestion).', 'budget'),
  ('Amendement', 'Modification formelle du budget initial après accord du bailleur, suivant un cycle d''approbation.', 'budget'),
  ('Taux d''exécution', 'Pourcentage des dépenses réalisées par rapport au budget initial ou amendé sur une période donnée.', 'reports'),
  ('Engagement', 'Montant juridiquement réservé pour une dépense future (commande, contrat) qui n''est pas encore payé.', 'transactions'),
  ('Contre-passe', 'Transaction inverse créée pour annuler une opération validée tout en conservant l''historique d''audit.', 'transactions')
ON CONFLICT (term) DO NOTHING;