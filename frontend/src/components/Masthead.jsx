import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Emblem from './Emblem'
import LanguageSwitcher from './LanguageSwitcher'

/*
 * The bilingual masthead. Both scripts are set in the same family at the
 * same weight, because a service that treats Tamil as the second line in a
 * smaller face has already told the reader whose service it is.
 *
 * The stepped bottom edge is a gopuram cornice, masked rather than drawn, so
 * it costs nothing and scales to any width.
 */
export default function Masthead({ to = '/farmer', wide = false, children }) {
  const { t } = useTranslation()

  return (
    <div className="bg-kummayam-800 bg-pulli text-arisi-100">
      <div
        className={`${
          wide ? 'max-w-[1800px]' : 'max-w-2xl lg:max-w-[1500px]'
        } mx-auto px-4 lg:px-10 py-4 flex items-center justify-between gap-4`}
      >
        <Link to={to} className="flex items-center gap-3 rounded-lg min-w-0">
          <Emblem size={44} className="text-manjal-300 shrink-0" />
          <span className="min-w-0">
            {/* Tamil first: this is read in a Tamil Nadu field before anywhere else. */}
            <span lang="ta" className="block font-display text-lg font-bold leading-tight truncate">
              {t('app_name_ta')}
            </span>
            <span lang="en" className="block font-display text-sm font-semibold text-arisi-300 leading-tight truncate">
              {t('app_name')} · {t('dept_name')}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {children}
          <LanguageSwitcher />
        </div>
      </div>

      <div className="h-2.5 bg-manjal-500 edge-cornice" aria-hidden="true" />
    </div>
  )
}
