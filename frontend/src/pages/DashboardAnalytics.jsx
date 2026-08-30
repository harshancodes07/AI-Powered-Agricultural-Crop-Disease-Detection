import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import BarChart from '../components/BarChart'
import { getCrops, getDiseaseBreakdown, getTrends } from '../services/api'
import { cropLabel, diseaseLabel } from '../utils/format'

export default function DashboardAnalytics() {
  const { t } = useTranslation()
  const [diseases, setDiseases] = useState([])
  const [crops, setCrops] = useState([])
  const [trends, setTrends] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getDiseaseBreakdown(), getCrops(), getTrends({ days: 14 })])
      .then(([d, c, tr]) => {
        setDiseases(d)
        setCrops(c)
        setTrends(tr)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <p role="alert" className="card border-red-300 bg-red-50 p-4 text-red-900 font-semibold">
        {error}
      </p>
    )
  }

  const maxTrend = Math.max(...trends.map((point) => point.count), 1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl xl:text-3xl font-display font-bold text-mai-900">{t('dash_analytics_title')}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="eyebrow mb-5">{t('dash_by_disease')}</h2>
          <BarChart
            emptyLabel={t('dash_no_reports')}
            data={diseases.map((d) => ({ label: diseaseLabel(t, d.disease), value: d.count }))}
          />
        </section>

        <section className="card p-6">
          <h2 className="eyebrow mb-5">{t('dash_filter_crop')}</h2>
          <BarChart
            emptyLabel={t('dash_no_reports')}
            data={crops.map((c) => ({ label: cropLabel(t, c.crop), value: c.count }))}
          />
        </section>
      </div>

      <section className="card p-6">
        <h2 className="eyebrow mb-5">{t('dash_over_time')}</h2>

        {trends.length === 0 ? (
          <p className="text-mai-700">{t('dash_no_reports')}</p>
        ) : (
          <>
            {/* Columns drawn with flexbox — a chart library would be overkill here. */}
            <div className="flex items-end gap-1 h-40" aria-hidden="true">
              {trends.map((point) => (
                <div
                  key={point.date}
                  className="flex-1 bg-pachai-700 rounded-t min-h-[2px] transition-all"
                  style={{ height: `${(point.count / maxTrend) * 100}%` }}
                />
              ))}
            </div>
            <p className="flex justify-between text-sm text-mai-600 mt-2">
              <span>{trends[0]?.date}</span>
              <span>{trends[trends.length - 1]?.date}</span>
            </p>

            {/* The same data as text, so the chart is not the only way to read it. */}
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold min-h-[2.75rem] flex items-center">
                {t('dash_over_time')}
              </summary>
              <ul className="mt-2 text-sm space-y-1">
                {trends.map((point) => (
                  <li key={point.date} className="flex justify-between border-b border-arisi-200 py-1">
                    <span>{point.date}</span>
                    <span className="tabular font-semibold">{point.count}</span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </section>
    </div>
  )
}
