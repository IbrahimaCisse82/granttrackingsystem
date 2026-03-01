import { Project, fmt } from '@/lib/mock-data';

export default function ProjectFiche({ project }: { project: Project }) {
  const versements = project.fiches.versements;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Fiche récapitulative des rapports financiers</h1>
        <p className="text-xs text-muted-foreground mt-1">Rapports financiers · {project.org}</p>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-rule bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-ink-2">
                {['Rapport', 'Période', 'Soumis le', 'Montant déclaré', 'Montant validé', 'Tranche', 'Date paiement', 'Montant reçu'].map(h => (
                  <th key={h} className="whitespace-nowrap border-r border-sidebar-foreground/5 px-3 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/70 font-mono last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versements.map((v, i) => (
                <tr key={i} className="hover:bg-paper/50 transition-colors">
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-semibold">Rapport N° {String(i + 1).padStart(3, '0')}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 text-muted-foreground">{v.periode}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-mono text-xs">{v.dateSoumission || '—'}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono">{v.montantDeclare ? fmt(v.montantDeclare) + ' €' : '—'}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 text-right font-mono">{v.montantValide ? fmt(v.montantValide) + ' €' : '—'}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5">{v.versement}</td>
                  <td className="border-b border-rule-2 border-r px-3 py-2.5 font-mono text-xs">{v.datePaiement || '—'}</td>
                  <td className="border-b border-rule-2 px-3 py-2.5 text-right font-mono font-semibold text-emerald">{v.montantRecu ? fmt(v.montantRecu) + ' €' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
