import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  LOW_CONFIDENCE_THRESHOLD,
  confidencePercent,
  cropLabel,
  diseaseLabel
} from '../utils/format'

/**
 * Shows one prediction and its verified treatment.
 *
 * `detail` normally arrives as router state straight after an upload, but it
 * can also be passed as a prop so a stored report renders identically.
 */
export default function Result({ detail: detailProp }) {
  const { t } = useTranslation()
  const location = useLocation()
  const detail = detailProp ?? location.state?.detail

  // Reached directly (e.g. a refresh) with nothing to show.
  if (!detail) return <Navigate to="/farmer/capture" replace />

  const { report, prediction, treatment } = detail
  const healthy = prediction?.disease === 'healthy'
  const lowConfidence =
    prediction != null && prediction.confidence < LOW_CONFIDENCE_THRESHOLD

  // The ML service was unreachable, but the report itself was kept.
  if (!prediction) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('result_title')}</h1>
        <section className="card border-amber-300 bg-amber-50 p-5">
          <h2 className="text-lg font-bold text-amber-900 mb-2">
            <span aria-hidden="true">⚠ </span>
            {t('result_failed')}
          </h2>
          <p className="text-amber-900">{t('result_failed_help')}</p>
        </section>
        <Link to="/farmer/capture" className="btn-primary w-full">
          {t('result_new_report')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('result_title')}</h1>

      {report.image_url && (
        <img
          src={report.image_url}
          alt=""
          className="w-full max-h-56 object-contain rounded-2xl border-2 border-slate-200 bg-white"
        />
      )}

      {/* Headline result. The icon and wording carry the meaning, not the colour. */}
      <section
        className={`card p-5 ${healthy ? 'border-brand-300 bg-brand-50' : 'border-amber-300 bg-amber-50'}`}
      >
        <p className="font-semibold text-slate-700 mb-1">
          <span aria-hidden="true">{healthy ? '✓ ' : '⚠ '}</span>
          {healthy ? t('result_healthy') : t('result_detected')}
        </p>
        <h2 className="text-2xl font-bold mb-4">
          {healthy
            ? cropLabel(t, prediction.crop)
            : diseaseLabel(t, prediction.disease)}
        </h2>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-600">{t('result_crop')}</dt>
            <dd className="font-semibold">{cropLabel(t, prediction.crop)}</dd>
          </div>
          <div>
            <dt className="text-slate-600">{t('result_confidence')}</dt>
            <dd className="font-semibold">{confidencePercent(prediction.confidence)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-600">{t('result_model')}</dt>
            <dd className="font-semibold">{prediction.model_version}</dd>
          </div>
        </dl>
      </section>

      {/* Uncertainty is stated plainly, every time (CLAUDE.md section 13). */}
      <section className="card border-slate-300 p-4 text-slate-800">
        <p>
          <span aria-hidden="true">ℹ </span>
          {t('result_uncertainty')}
        </p>
        {lowConfidence && (
          <p className="mt-2 font-semibold text-amber-900">{t('result_low_confidence')}</p>
        )}
      </section>

      {/* Verified treatment, or an honest statement that we have none. */}
      {treatment && (
        <section className="card p-5">
          <h2 className="text-xl font-bold mb-3">{t('result_treatment')}</h2>

          {!treatment.verified && (
            <p className="mb-3 font-semibold text-amber-900">
              <span aria-hidden="true">⚠ </span>
              {t('result_unverified')}
            </p>
          )}

          <p className="whitespace-pre-line leading-relaxed">{treatment.recommendation}</p>

          {treatment.source && (
            <p className="mt-4 pt-3 border-t border-slate-200 text-sm text-slate-600">
              <span className="font-semibold">{t('result_source')}: </span>
              {treatment.source}
            </p>
          )}
        </section>
      )}

      <div className="space-y-3">
        <Link to="/farmer/capture" className="btn-primary w-full">
          {t('result_new_report')}
        </Link>
        <Link to="/farmer/history" className="btn-secondary w-full">
          {t('nav_history')}
        </Link>
      </div>
    </div>
  )
}
