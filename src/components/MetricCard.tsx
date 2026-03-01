interface MetricCardProps {
  label: string;
  value: string;
  note?: string;
  accentColor: string;
}

const ACCENT_MAP: Record<string, string> = {
  blue: 'bg-primary',
  teal: 'bg-teal',
  amber: 'bg-amber',
  emerald: 'bg-emerald',
  violet: 'bg-violet',
  rose: 'bg-rose',
};

export default function MetricCard({ label, value, note, accentColor }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-rule bg-card p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-mono text-[22px] font-semibold leading-none text-foreground">{value}</p>
      {note && <p className="mt-1 text-[11px] text-dim">{note}</p>}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${ACCENT_MAP[accentColor] || 'bg-primary'}`} />
    </div>
  );
}
