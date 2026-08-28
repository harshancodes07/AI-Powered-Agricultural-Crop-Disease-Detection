import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AdviceList from '../components/AdviceList'
import SeverityBadge, { SeverityHelp } from '../components/SeverityBadge'
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
  // The model was never trained on this crop. Anything it "predicts" here is
  // about some other plant entirely, so we must not show it as a diagnosis.
  const cropUnsupported = prediction?.crop_supported === false
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

  // Crop outside the model's training set: show the honest refusal and nothing
  // that could be mistaken for a diagnosis.
  if (cropUnsupported) {
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

        <section className="card border-red-300 bg-red-50 p-5">
          <h2 className="text-lg font-bold text-red-900 mb-2">
            <span aria-hidden="true">⚠ </span>
            {t('result_crop_unsupported_title')}
          </h2>
          <p className="text-red-900">{t('result_crop_unsupported')}</p>
        </section>

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

      {/* Runner-up diagnoses: similar-looking diseases the farmer should rule out. */}
      {prediction.alternatives?.length > 0 && (
        <section className="card p-5">
          <h2 className="text-xl font-bold mb-1">{t('result_alternatives')}</h2>
          <p className="text-sm text-slate-600 mb-4">{t('result_alternatives_help')}</p>
          <ul className="space-y-2">
            {prediction.alternatives.map((alt) => (
              <li
                key={`${alt.crop}-${alt.disease}`}
                className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"
              >
                <span className="font-semibold">{diseaseLabel(t, alt.disease)}</span>
                <span className="tabular-nums text-slate-700 shrink-0">
                  {confidencePercent(alt.confidence)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {/* Verified guidance, broken into the parts a farmer actually acts on.
          If we have nothing verified, we say so instead of improvising. */}
      {treatment && !treatment.verified && (
        <section className="card border-amber-300 bg-amber-50 p-5">
          <h2 className="text-xl font-bold mb-2 text-amber-900">{t('result_treatment')}</h2>
          <p className="font-semibold text-amber-900">
            <span aria-hidden="true">⚠ </span>
            {t('result_unverified')}
          </p>
          <p className="mt-3 leading-relaxed">{treatment.recommendation}</p>
        </section>
      )}

      {treatment && treatment.verified && (
        <>
          {/* How urgently to act — the first thing a farmer needs to know. */}
          {!healthy && (
            <section className="card p-5">
              <h2 className="text-lg font-bold mb-3">{t('result_severity')}</h2>
              <SeverityBadge severity={treatment.severity} />
              <SeverityHelp severity={treatment.severity} />
            </section>
          )}

          {treatment.summary && (
            <section className="card p-5">
              <p className="text-lg leading-relaxed">{treatment.summary}</p>
            </section>
          )}

          {/* Symptoms let the farmer sanity-check the AI rather than trust it. */}
          {treatment.symptoms && (
            <section className="card p-5">
              <h2 className="text-xl font-bold mb-1">{t('result_symptoms')}</h2>
              <p className="text-sm text-slate-600 mb-3">{t('result_symptoms_help')}</p>
              <p className="leading-relaxed">{treatment.symptoms}</p>
            </section>
          )}

          {treatment.cause && (
            <section className="card p-5">
              <h2 className="text-xl font-bold mb-3">{t('result_cause')}</h2>
              <p className="leading-relaxed">{treatment.cause}</p>
            </section>
          )}

          {treatment.immediate_actions?.length > 0 && (
            <section className="card border-brand-300 p-5">
              <h2 className="text-xl font-bold mb-4">{t('result_actions')}</h2>
              <AdviceList items={treatment.immediate_actions} ordered />
            </section>
          )}

          {treatment.prevention?.length > 0 && (
            <section className="card p-5">
              <h2 className="text-xl font-bold mb-4">{t('result_prevention')}</h2>
              <AdviceList items={treatment.prevention} />
            </section>
          )}

          {treatment.expert_note && (
            <section className="card border-slate-300 bg-slate-50 p-5">
              <h2 className="text-xl font-bold mb-3">{t('result_expert')}</h2>
              <p className="leading-relaxed">{treatment.expert_note}</p>
            </section>
          )}

          {treatment.source && (
            <p className="text-sm text-slate-600 px-1">
              <span className="font-semibold">{t('result_source')}: </span>
              {treatment.source}
            </p>
          )}
        </>
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
