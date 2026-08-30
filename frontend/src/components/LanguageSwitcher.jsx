import { useTranslation } from 'react-i18next'

import { LANGUAGES, setLanguage } from '../i18n'

/** Language choice, available on every screen. */
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div role="group" aria-label={t('language')} className="flex gap-1">
      {LANGUAGES.map((language) => {
        const active = i18n.language === language.code
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            onClick={() => setLanguage(language.code)}
            aria-pressed={active}
            className={`min-h-[2.75rem] px-4 rounded-lg font-semibold border-2 transition ${
              active
                ? 'bg-white text-pachai-900 border-white'
                : 'bg-transparent text-white border-white/60 hover:bg-white/10'
            }`}
          >
            {language.nativeLabel}
          </button>
        )
      })}
    </div>
  )
}
