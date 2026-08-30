import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import DashboardFilters, { EMPTY_FILTERS } from '../components/DashboardFilters'
import { getMapPoints, listReports } from '../services/api'
import { confidencePercent, cropLabel, diseaseLabel, formatDate } from '../utils/format'

/**
 * Tabular view of all reports.
 *
 * Uses the dashboard map endpoint as the data source because it already joins
 * predictions and, importantly, carries no farmer identity.
 */
export default function DashboardReports() {
  const { t, i18n } = useTranslation()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    getMapPoints({ ...filters, limit: 500 })
      .then((data) => {
        setRows(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [filters])

  return (
    <div className="space-y-6">
      <DashboardFilters filters={filters} onChange={setFilters} />

      <section className="card p-6">
        <h2 className="eyebrow mb-5">{t('dash_reports_title')}</h2>

        {error && <p role="alert" className="text-red-900 font-semibold">{error}</p>}

        {rows.length === 0 ? (
          <p role="status" className="text-mai-700">{t('dash_no_reports')}</p>
        ) : (
          /* Wide tables scroll inside their own container rather than pushing
             the whole page sideways. */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">{t('dash_reports_title')}</caption>
              <thead>
                <tr className="border-b-2 border-arisi-300">
                  <th scope="col" className="py-2 pr-4 font-display font-bold text-mai-700">{t('dash_col_id')}</th>
                  <th scope="col" className="py-2 pr-4 font-display font-bold text-mai-700">{t('dash_col_crop')}</th>
                  <th scope="col" className="py-2 pr-4 font-display font-bold text-mai-700">{t('dash_col_disease')}</th>
                  <th scope="col" className="py-2 pr-4 font-display font-bold text-mai-700">{t('dash_col_confidence')}</th>
                  <th scope="col" className="py-2 pr-4 font-display font-bold text-mai-700">{t('dash_col_region')}</th>
                  <th scope="col" className="py-2 font-display font-bold text-mai-700">{t('dash_col_date')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-arisi-200 hover:bg-arisi-100/60">
                    <td className="py-2.5 pr-4 tabular">{row.id}</td>
                    <td className="py-2.5 pr-4">{cropLabel(t, row.crop)}</td>
                    <td className="py-2.5 pr-4 font-semibold">{diseaseLabel(t, row.disease)}</td>
                    <td className="py-2.5 pr-4 tabular">{confidencePercent(row.confidence)}</td>
                    <td className="py-2.5 pr-4">{row.region || '—'}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      {formatDate(row.created_at, i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
