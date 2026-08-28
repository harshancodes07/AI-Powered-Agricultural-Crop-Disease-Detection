import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import BarChart from '../components/BarChart'
import DashboardFilters, { EMPTY_FILTERS } from '../components/DashboardFilters'
import KpiCard from '../components/KpiCard'
import { getDiseaseBreakdown, getSummary } from '../services/api'
import { diseaseLabel } from '../utils/format'

export default function DashboardHome() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [summary, setSummary] = useState(null)
  const [diseases, setDiseases] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getSummary(filters), getDiseaseBreakdown(filters)])
      .then(([s, d]) => {
        setSummary(s)
        setDiseases(d)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [filters])

  if (error) {
    return (
      <p role="alert" className="card border-red-300 bg-red-50 p-4 text-red-900 font-semibold">
        {error}
      </p>
    )
  }
  if (!summary) return <p role="status" className="card p-6">{t('loading')}</p>

  return (
    <div className="space-y-6">
      <DashboardFilters filters={filters} onChange={setFilters} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t('dash_total_reports')} value={summary.total_reports} />
        <KpiCard label={t('dash_affected_areas')} value={summary.affected_areas} />
        <KpiCard
          label={t('dash_common_disease')}
          value={
            summary.most_common_disease
              ? diseaseLabel(t, summary.most_common_disease)
              : t('dash_none')
          }
          hint={
            summary.most_common_disease
              ? `${summary.most_common_disease_count} ${t('dash_total_reports').toLowerCase()}`
              : undefined
          }
        />
        <KpiCard label={t('dash_high_risk')} value={summary.high_risk_areas} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label={t('dash_healthy')} value={summary.healthy_reports} />
        <KpiCard label={t('dash_diseased')} value={summary.diseased_reports} />
      </div>

      <section className="card p-5">
        <h2 className="text-xl font-bold mb-4">{t('dash_by_disease')}</h2>
        <BarChart
          emptyLabel={t('dash_no_reports')}
          data={diseases.map((d) => ({
            label: diseaseLabel(t, d.disease),
            value: d.count
          }))}
        />
      </section>
    </div>
  )
}
