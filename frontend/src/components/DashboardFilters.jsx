import { useTranslation } from 'react-i18next'

import { cropLabel, diseaseLabel } from '../utils/format'

const CROPS = ['tomato', 'potato', 'corn', 'rice']
const DISEASES = [
  'early_blight', 'late_blight', 'leaf_mold', 'common_rust',
  'northern_leaf_blight', 'leaf_blast', 'bacterial_leaf_blight', 'healthy'
]

/** Shared crop / disease / date filters used across the dashboard pages. */
export default function DashboardFilters({ filters, onChange }) {
  const { t } = useTranslation()

  const set = (key) => (event) => onChange({ ...filters, [key]: event.target.value })

  return (
    <section className="card p-4" aria-labelledby="filters-heading">
      <h2 id="filters-heading" className="eyebrow mb-4">
        {t('dash_filters')}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
        <div>
          <label htmlFor="filter-crop" className="field-label">{t('dash_filter_crop')}</label>
          <select id="filter-crop" className="input" value={filters.crop} onChange={set('crop')}>
            <option value="">{t('dash_filter_all')}</option>
            {CROPS.map((c) => (
              <option key={c} value={c}>{cropLabel(t, c)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-disease" className="field-label">{t('dash_filter_disease')}</label>
          <select id="filter-disease" className="input" value={filters.disease} onChange={set('disease')}>
            <option value="">{t('dash_filter_all')}</option>
            {DISEASES.map((d) => (
              <option key={d} value={d}>{diseaseLabel(t, d)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-from" className="field-label">{t('dash_filter_from')}</label>
          <input id="filter-from" type="date" className="input" value={filters.date_from} onChange={set('date_from')} />
        </div>

        <div>
          <label htmlFor="filter-to" className="field-label">{t('dash_filter_to')}</label>
          <input id="filter-to" type="date" className="input" value={filters.date_to} onChange={set('date_to')} />
        </div>
      </div>

      <button
        type="button"
        className="btn-quiet mt-4"
        onClick={() => onChange({ crop: '', disease: '', date_from: '', date_to: '' })}
      >
        {t('dash_clear_filters')}
      </button>
    </section>
  )
}

export const EMPTY_FILTERS = { crop: '', disease: '', date_from: '', date_to: '' }
