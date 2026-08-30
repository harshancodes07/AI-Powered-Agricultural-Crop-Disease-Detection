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
 * without being asked to. From `md` (768px) up — a small laptop window, a
 * tablet in landscape, a half-maximised browser, not just a large monitor —
 * navigation moves into a header band instead, matching the tab row the
 * government dashboard already uses. The switch point used to be `lg`
 * (1024px), which left a genuinely wide range of real window sizes with
 * nothing but empty margin either side of a phone-width card: the content
 * column was already capped narrow, but the sidebar that was meant to use
 * that space hadn't switched on yet.
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
      <Masthead to="/" />
      <AdvisoryTicker />

      <nav aria-label={t('nav_home')} className="hidden md:block bg-kummayam-900 border-t border-arisi-100/10">
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
       * a comfortable-width primary column plus, from `md` up, a sticky
       * context panel that grows with the window (280px -> 340px -> 380px)
       * rather than snapping in all at once. Below `md` the grid collapses
       * to one column and the sidebar simply isn't rendered — the phone
       * experience is untouched, not shrunk.
       *
       * The main track is a fixed 42rem (matching the reading width the
       * content itself wants), not `1fr` — `1fr` greedily fills whatever the
       * 1500px shell has left over, which on a genuinely wide monitor is far
       * more than 672px, and the form inside doesn't stretch to match, so a
       * visible dead gap opened up between the form and the sidebar. With a
       * fixed-width main track the grid's own footprint stops growing once
       * both columns are comfortable, and `justify-center` centers that
       * whole (form + sidebar) block as one unit — any extra width becomes
       * ordinary, symmetric page margin instead of a gap between two boxes.
       */}
      <main
        id="main"
        className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10 pb-28 md:pb-10"
      >
        <div className="md:grid md:justify-center md:grid-cols-[minmax(0,42rem)_280px] lg:grid-cols-[minmax(0,42rem)_340px] xl:grid-cols-[minmax(0,42rem)_380px] md:gap-8 lg:gap-12 md:items-start">
          <div className="max-w-2xl w-full">
            <Outlet />
          </div>

          <aside aria-label={t('nav_home')} className="hidden md:block md:sticky md:top-8">
            <FarmerSidebar />
          </aside>
        </div>
      </main>

      <nav
        aria-label={t('nav_home')}
        className="md:hidden fixed bottom-0 inset-x-0 bg-arisi-50 border-t-2 border-arisi-300 z-30"
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
