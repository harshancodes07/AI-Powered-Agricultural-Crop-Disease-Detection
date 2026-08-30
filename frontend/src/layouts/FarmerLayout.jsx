import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AdvisoryTicker from '../components/AdvisoryTicker'
import ConnectionBanner from '../components/ConnectionBanner'
import FarmerSidebar from '../components/FarmerSidebar'
import GovStrip from '../components/GovStrip'
import Masthead from '../components/Masthead'

const TABS = [
  { to: '/farmer', end: true, labelKey: 'nav_home', icon: '🏠' },
  { to: '/farmer/capture', labelKey: 'nav_capture', icon: '📷' },
  { to: '/farmer/history', labelKey: 'nav_history', icon: '📋' }
]

/*
 * One screen, two navigation patterns, chosen by the same TABS list.
 *
 * On a phone this is a fixed bottom bar — the one place a thumb rests
 * without being asked to. On a desk monitor a bar pinned to the bottom of
 * a 1080px-tall window reads as a phone shape left where it was built,
 * so from `lg` up navigation moves into a header band instead, matching
 * the tab row the government dashboard already uses — one visual grammar
 * for both halves of the platform.
 */
export default function FarmerLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:px-4 focus:py-3 focus:bg-white focus:text-pachai-900 focus:rounded-lg focus:font-semibold"
      >
        {t('nav_home')}
      </a>

      <GovStrip />
      <Masthead to="/farmer" />
      <AdvisoryTicker />

      <nav aria-label={t('nav_home')} className="hidden lg:block bg-kummayam-900 border-t border-arisi-100/10">
        <ul className="max-w-[1500px] mx-auto px-10 flex gap-1">
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `inline-flex items-center min-h-[3rem] px-4 font-display font-semibold text-sm border-b-4 transition-colors ${
                    isActive
                      ? 'border-manjal-500 text-arisi-50'
                      : 'border-transparent text-arisi-300 hover:text-arisi-50'
                  }`
                }
              >
                {t(tab.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <ConnectionBanner />

      {/*
       * The workspace: a wide shell (matching the masthead above it) holding
       * a comfortable-width primary column plus, from `lg` up, a sticky
       * context panel. Below `lg` the grid collapses to one column and the
       * sidebar simply isn't rendered — the phone experience is untouched,
       * not shrunk.
       */}
      <main
        id="main"
        className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-28 lg:pb-10"
      >
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:items-start">
          <div className="max-w-2xl">
            <Outlet />
          </div>

          <aside aria-label={t('nav_home')} className="hidden lg:block lg:sticky lg:top-8">
            <FarmerSidebar />
          </aside>
        </div>
      </main>

      <nav
        aria-label={t('nav_home')}
        className="lg:hidden fixed bottom-0 inset-x-0 bg-arisi-50 border-t-2 border-arisi-300 z-30"
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
