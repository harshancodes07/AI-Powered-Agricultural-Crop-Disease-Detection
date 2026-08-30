import { useTranslation } from 'react-i18next'

import { useDisplayPrefs } from '../hooks/useDisplayPrefs'

/*
 * The thin official band that sits above the masthead on public-service
 * sites, carrying the things a visitor must always be able to reach: who
 * runs the service, and the controls that make it readable.
 */
export default function GovStrip() {
  const { t } = useTranslation()
  const { stepScale, resetScale, canGrow, canShrink, highContrast, toggleContrast } =
    useDisplayPrefs()

  const chip =
    'min-h-[2rem] min-w-[2rem] px-2 rounded font-data font-semibold ' +
    'border border-arisi-200/40 hover:bg-arisi-100/15 ' +
    'disabled:opacity-40 disabled:hover:bg-transparent transition-colors'

  return (
    <div className="gov-strip">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="font-display tracking-wide">{t('gov_strip')}</p>

        <div className="flex items-center gap-3">
          <div role="group" aria-label={t('a11y_text_size')} className="flex items-center gap-1">
            <span className="hidden sm:inline opacity-80">{t('a11y_text_size')}</span>
            <button type="button" className={chip} onClick={() => stepScale(-1)} disabled={!canShrink}>
              A<span aria-hidden="true">−</span>
              <span className="sr-only">{t('a11y_text_smaller')}</span>
            </button>
            <button type="button" className={chip} onClick={resetScale}>
              A<span className="sr-only">{t('a11y_text_reset')}</span>
            </button>
            <button type="button" className={chip} onClick={() => stepScale(1)} disabled={!canGrow}>
              A<span aria-hidden="true">+</span>
              <span className="sr-only">{t('a11y_text_larger')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={toggleContrast}
            aria-pressed={highContrast}
            className={`${chip} px-2.5`}
          >
            <span aria-hidden="true">◐</span>{' '}
            <span className="hidden sm:inline">{t('a11y_contrast')}</span>
            <span className="sm:hidden sr-only">{t('a11y_contrast')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
