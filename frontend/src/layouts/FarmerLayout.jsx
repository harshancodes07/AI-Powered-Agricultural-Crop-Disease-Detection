import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AdvisoryTicker from '../components/AdvisoryTicker'
import ConnectionBanner from '../components/ConnectionBanner'
import GovStrip from '../components/GovStrip'
import Masthead from '../components/Masthead'

// Bottom navigation: on a phone this is where a thumb naturally rests.
const TABS = [
  { to: '/farmer', end: true, labelKey: 'nav_home', icon: '🏠' },
  { to: '/farmer/capture', labelKey: 'nav_capture', icon: '📷' },
  { to: '/farmer/history', labelKey: 'nav_history', icon: '📋' }
]

export default function FarmerLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Lets keyboard users jump past the header straight to the content. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:px-4 focus:py-3 focus:bg-white focus:text-pachai-900 focus:rounded-lg focus:font-semibold"
      >
        {t('nav_home')}
      </a>

      <GovStrip />
      <Masthead to="/farmer" />
      <AdvisoryTicker />

      <ConnectionBanner />

      <main id="main" className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-28">
        <Outlet />
      </main>

      <nav
        aria-label={t('nav_home')}
        className="fixed bottom-0 inset-x-0 bg-arisi-50 border-t-2 border-arisi-300 z-30"
      >
        <ul className="max-w-2xl mx-auto grid grid-cols-3">
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[3.5rem] font-display text-sm font-semibold border-t-4 ${
                    isActive
                      ? 'text-pachai-800 border-pachai-700 bg-pachai-50'
                      : 'text-mai-600 border-transparent'
                  }`
                }
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {tab.icon}
                </span>
                {t(tab.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
