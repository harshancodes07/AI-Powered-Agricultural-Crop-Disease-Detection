import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import GovStrip from '../components/GovStrip'
import Masthead from '../components/Masthead'
import { demoMode, onDemoModeChange } from '../services/api'

const TABS = [
  { to: '/dashboard', end: true, labelKey: 'nav_dashboard' },
  { to: '/dashboard/map', labelKey: 'nav_map' },
  { to: '/dashboard/reports', labelKey: 'nav_reports' },
  { to: '/dashboard/analytics', labelKey: 'nav_analytics' }
]

/*
 * The official-facing side. Same masthead grammar as the farmer app — this is
 * one service, not two — but `wide` so the branding uses the full masthead
 * width instead of the phone-width column the farmer screens are built for.
 *
 * Officials read this on a desk monitor, not a cracked phone in a field, so
 * the content column is allowed to run much wider: a map or a reports table
 * that stays boxed at phone-app width just wastes the screen it's on.
 */
export default function DashboardLayout() {
  const { t } = useTranslation()
  const [isDemo, setIsDemo] = useState(demoMode.active)

  useEffect(() => onDemoModeChange(setIsDemo), [])

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:px-4 focus:py-3 focus:bg-white focus:text-pachai-900 focus:rounded-lg focus:font-semibold"
      >
        {t('nav_dashboard')}
      </a>

      <GovStrip />

      <Masthead to="/dashboard" wide>
        <Link
          to="/farmer"
          className="hidden sm:inline-flex items-center min-h-[2.75rem] px-4 rounded-lg border-2 border-arisi-200/50 font-display font-semibold text-sm hover:bg-arisi-100/15"
        >
          {t('nav_home')}
        </Link>
      </Masthead>

      <nav aria-label={t('nav_dashboard')} className="bg-kummayam-900 border-t border-arisi-100/10">
        <ul className="max-w-[1800px] mx-auto px-4 lg:px-8 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `inline-flex items-center min-h-[3rem] px-4 font-display font-semibold text-sm border-b-4 whitespace-nowrap transition-colors ${
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

      {/*
       * The width cap: generous enough to feel edge-to-edge on a laptop or a
       * 1440p monitor, but not literally unbounded — a map or table that
       * really did stretch across a 32" ultrawide would be harder to read,
       * not easier.
       */}
      <main
        id="main"
        className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
      >
        {isDemo && (
          <p
            role="status"
            className="card mb-6 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          >
            {t('dash_demo_notice')}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  )
}
