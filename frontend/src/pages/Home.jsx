import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h1 className="text-2xl font-bold mb-3">{t('home_title')}</h1>
        <p className="text-slate-700 mb-6">{t('home_intro')}</p>

        <div className="space-y-3">
          <Link to="/farmer/capture" className="btn-primary w-full text-lg">
            <span aria-hidden="true">📷</span>
            {t('home_start')}
          </Link>
          <Link to="/farmer/history" className="btn-secondary w-full">
            {t('home_history')}
          </Link>
        </div>
      </section>

      <p className="text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center min-h-[2.75rem] px-3 text-slate-600 underline underline-offset-2"
        >
          {t('home_gov')}
        </Link>
      </p>
    </div>
  )
}
