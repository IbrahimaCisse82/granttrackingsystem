import { useTranslation } from 'react-i18next';

/** Compact FR/EN switch — instant, no reload, session preserved. */
export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'fr';

  const change = (lng: 'fr' | 'en') => {
    if (lng === current) return;
    i18n.changeLanguage(lng);
    try { localStorage.setItem('i18nextLng', lng); } catch { /* storage unavailable */ }
    try { document.documentElement.lang = lng; } catch { /* noop */ }
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('profile.language', 'Langue')}
      className="flex items-center rounded-md border border-rule bg-card p-0.5"
    >
      {(['fr', 'en'] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          role="radio"
          aria-checked={current === lng}
          onClick={() => change(lng)}
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase transition-colors ${
            current === lng
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}
