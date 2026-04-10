import type { Project } from '@/lib/types';
import { Info } from 'lucide-react';
import { useCallback } from 'react';

function calcDuree(debut: string, fin: string): string {
  if (!debut || !fin) return '—';
  const d1 = new Date(debut);
  const d2 = new Date(fin);
  const months = (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth();
  return `${months} mois`;
}

function calcRisqueLevel(score: string): string {
  const n = parseFloat(score);
  if (isNaN(n)) return '';
  if (n <= 25) return 'Faible risque';
  if (n <= 50) return 'Risque modéré';
  if (n <= 75) return 'Risque important';
  return 'Risque élevé';
}

const RISK_STYLES: Record<string, string> = {
  'Faible risque': 'bg-emerald-light text-emerald',
  'Risque modéré': 'bg-teal-light text-teal',
  'Risque important': 'bg-amber-light text-amber',
  'Risque élevé': 'bg-rose-light text-rose',
};

interface Props {
  project: Project;
  onSave: (partial: Partial<Project>) => void;
  readOnly?: boolean;
}

export default function ProjectInfos({ project, onSave, readOnly }: Props) {
  const duree = calcDuree(project.debut, project.fin);

  const handleField = useCallback((field: keyof Project, value: string) => {
    if (readOnly) return;
    onSave({ [field]: field === 'taux' ? Number(value) : value } as Partial<Project>);
  }, [onSave, readOnly]);

  const handleInfoField = useCallback((key: keyof Project['infos'], value: string) => {
    if (readOnly) return;
    onSave({ infos: { ...project.infos, [key]: value } });
  }, [onSave, project.infos, readOnly]);

  const handleScoreChange = useCallback((value: string) => {
    if (readOnly) return;
    const risque = calcRisqueLevel(value);
    onSave({ infos: { ...project.infos, scoreRisque: value }, risque });
  }, [onSave, project.infos, readOnly]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Informations générales</h1>
          <p className="text-xs text-muted-foreground mt-1">{project.org} · {project.convention}</p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-primary/30 bg-enabel-light p-3 text-xs text-enabel-dark mb-4">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{readOnly ? 'Vous êtes en mode lecture seule.' : 'Les modifications sont sauvegardées automatiquement.'}</span>
      </div>

      <Card title="Identification de la convention">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Convention N°" value={project.convention} required onChange={v => handleField('convention', v)} disabled={readOnly} />
          <Field label="Version du budget" value={project.infos.version === 'initial' ? 'Budget initial Annexe 1b' : `Addenda n°${project.infos.version.replace('addenda','')}`} onChange={v => handleInfoField('version', v)} disabled={readOnly} />
          <Field label="Soumis par (date)" value={project.infos.submitDate} type="date" onChange={v => handleInfoField('submitDate', v)} disabled={readOnly} />
          <Field label="Préparé par" value={project.infos.preparedBy} onChange={v => handleInfoField('preparedBy', v)} disabled={readOnly} />
        </div>
      </Card>

      <Card title="Bénéficiaire">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom de l'organisation" value={project.org} required onChange={v => handleField('org', v)} disabled={readOnly} />
          <Field label="Type d'organisation" value={project.orgType} onChange={v => handleField('orgType', v)} disabled={readOnly} />
          <div className="col-span-2">
            <Field label="Titre de l'action" value={project.title} onChange={v => handleField('title', v)} disabled={readOnly} />
          </div>
        </div>
      </Card>

      <Card title="Paramètres financiers & temporels">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Pays" value={project.pays} onChange={v => handleField('pays', v)} disabled={readOnly} />
          <Field label="Devise locale" value={project.devise} onChange={v => handleField('devise', v)} disabled={readOnly} />
          <Field label="Taux de change (1 EUR =)" value={String(project.taux)} onChange={v => handleField('taux', v)} disabled={readOnly} />
          <Field label="Date de début" value={project.debut} type="date" onChange={v => handleField('debut', v)} disabled={readOnly} />
          <Field label="Date de fin" value={project.fin} type="date" onChange={v => handleField('fin', v)} disabled={readOnly} />
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Durée (auto)</label>
            <div className="rounded-md border border-primary/30 bg-enabel-light px-3 py-2 font-mono text-xs text-primary">{duree}</div>
          </div>
          <Field label="Périodicité" value={project.periodicite} onChange={v => handleField('periodicite', v)} disabled={readOnly} />
          <Field label="Score de risque (%)" value={project.infos.scoreRisque} onChange={handleScoreChange} disabled={readOnly} />
          <div>
            <label className="block text-[11.5px] font-medium text-steel mb-1">Niveau de risque (auto)</label>
            <div className={`inline-block rounded px-2 py-1 font-mono text-[10.5px] font-semibold ${RISK_STYLES[project.risque] || 'bg-muted text-steel'}`}>
              {project.risque || '—'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 overflow-hidden rounded-[10px] border border-rule bg-card">
      <div className="border-b border-rule px-4 py-3">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, value, required, type, onChange, disabled }: { label: string; value: string; required?: boolean; type?: string; onChange?: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-steel mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type || 'text'}
        defaultValue={value}
        key={value}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}
