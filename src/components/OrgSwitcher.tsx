import { useOrganization } from '@/hooks/useOrganization';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function OrgSwitcher() {
  const { organizations, activeOrg, setActiveOrg } = useOrganization();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Building2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-sidebar-foreground/70 truncate">
          {activeOrg?.name || 'Organisation'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 w-full hover:bg-sidebar-foreground/5 transition-colors"
      >
        <Building2 className="w-4 h-4 text-primary" />
        <span className="flex-1 text-left text-xs font-semibold text-sidebar-foreground/70 truncate">
          {activeOrg?.name || 'Organisation'}
        </span>
        <ChevronDown className={`w-3 h-3 text-sidebar-foreground/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-card shadow-lg py-1">
          {organizations.map(org => (
            <button
              key={org.id}
              onClick={() => { setActiveOrg(org.id); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
            >
              <span className="flex-1 text-left truncate font-medium text-foreground">{org.name}</span>
              {org.id === activeOrg?.id && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
