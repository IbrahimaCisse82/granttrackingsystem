import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'fr';

  const change = (lng: 'fr' | 'en') => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('i18nextLng', lng); } catch {}
  };

  return (
    <div className="rounded-[10px] border border-rule bg-card mt-4">
      <div className="border-b border-rule px-4 py-3 flex items-center gap-2">
        <Languages className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-[13px] font-semibold">{t('profile.language', 'Langue')}</h3>
      </div>
      <div className="p-4 flex gap-2" role="radiogroup" aria-label={t('profile.language', 'Langue')}>
        {(['fr', 'en'] as const).map((lng) => (
          <button
            key={lng}
            role="radio"
            aria-checked={current === lng}
            onClick={() => change(lng)}
            className={`rounded-md border px-4 py-2 text-xs font-medium transition-colors ${
              current === lng
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-rule bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {lng === 'fr' ? 'Français' : 'English'}
          </button>
        ))}
        <p className="self-center text-[11px] text-muted-foreground ml-2">
          {t('profile.languageHint', 'Préférence de langue de l\'interface')}
        </p>
      </div>
    </div>
  );
}
