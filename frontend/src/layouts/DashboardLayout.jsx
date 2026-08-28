import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import LanguageSwitcher from '../components/LanguageSwitcher'

const TABS = [
  { to: '/dashboard', end: true, labelKey: 'nav_dashboard' },
  { to: '/dashboard/map', labelKey: 'nav_map' },
  { to: '/dashboard/reports', labelKey: 'nav_reports' },
  { to: '/dashboard/analytics', labelKey: 'nav_analytics' }
]

export default function DashboardLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xl font-bold leading-tight">{t('dash_title')}</p>
            <p className="text-sm text-slate-300">{t('dash_subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/farmer"
              className="min-h-[2.75rem] inline-flex items-center px-4 rounded-lg border-2 border-white/60 font-semibold hover:bg-white/10"
            >
              {t('nav_home')}
            </Link>
          </div>
        </div>

        <nav aria-label={t('nav_dashboard')} className="border-t border-white/15">
          <ul className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `inline-flex items-center min-h-[3rem] px-4 font-semibold border-b-4 whitespace-nowrap ${
                      isActive
                        ? 'border-brand-400 text-white'
                        : 'border-transparent text-slate-300 hover:text-white'
                    }`
                  }
                >
                  {t(tab.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
