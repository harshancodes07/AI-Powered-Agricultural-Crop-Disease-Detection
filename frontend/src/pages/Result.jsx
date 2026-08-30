import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resolveAssetUrl } from '../services/api'

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
 *
 * Laid out as a small number of purposeful sections rather than one card per
 * field: a single diagnosis card carries everything about *what* was found
 * (image, name, confidence, severity, alternatives, the uncertainty note),
 * then the treatment content groups into "understanding it", "do this now"
 * and "looking ahead" — the order a farmer actually reads in, not the order
 * the API happens to return fields.
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
        <h1 className="text-2xl font-display font-bold text-mai-900">{t('result_title')}</h1>
        <section className="card border-manjal-300 bg-manjal-100/40 p-5">
          <h2 className="text-lg font-display font-bold text-mai-900 mb-2">
            <span aria-hidden="true">⚠ </span>
            {t('result_failed')}
          </h2>
          <p className="text-mai-800">{t('result_failed_help')}</p>
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
        <h1 className="text-2xl font-display font-bold text-mai-900">{t('result_title')}</h1>

        {report.image_url && (
          <img
            src={resolveAssetUrl(report.image_url)}
            alt=""
            className="w-full max-h-56 object-contain rounded-2xl border-2 border-arisi-300 bg-white"
          />
        )}

        <section className="card border-semmann-400 bg-semmann-50 p-5">
          <h2 className="text-lg font-display font-bold text-semmann-800 mb-2">
            <span aria-hidden="true">⚠ </span>
            {t('result_crop_unsupported_title')}
          </h2>
          <p className="text-semmann-800">{t('result_crop_unsupported')}</p>
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
      <h1 className="text-2xl font-display font-bold text-mai-900">{t('result_title')}</h1>

      {/* ---- The diagnosis: one card, everything about "what was found" --- */}
      <section className="card-kolam overflow-hidden">
        {report.image_url && (
          <img
            src={resolveAssetUrl(report.image_url)}
            alt=""
            className="w-full max-h-56 object-contain bg-white border-b border-arisi-200"
          />
        )}

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="font-semibold text-mai-700">
              <span aria-hidden="true">{healthy ? '✓ ' : '⚠ '}</span>
              {healthy ? t('result_healthy') : t('result_detected')}
            </p>
            {!healthy && <SeverityBadge severity={treatment?.severity} />}
          </div>

          <h2 className="text-2xl font-display font-bold text-mai-900 mb-1">
            {healthy ? cropLabel(t, prediction.crop) : diseaseLabel(t, prediction.disease)}
          </h2>

          {!healthy && <SeverityHelp severity={treatment?.severity} />}

          <p className="tabular text-sm text-mai-600 mt-3">
            {cropLabel(t, prediction.crop)} · {t('result_confidence')}{' '}
            {confidencePercent(prediction.confidence)} · {prediction.model_version}
          </p>

          {/* Runner-up diagnoses: kept compact and inline, since they are
              supporting evidence, not a second diagnosis. */}
          {prediction.alternatives?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-arisi-200">
              <p className="text-xs font-display font-semibold uppercase tracking-wide text-mai-500 mb-2">
                {t('result_alternatives')}
              </p>
              <ul className="flex flex-wrap gap-2">
                {prediction.alternatives.map((alt) => (
                  <li
                    key={`${alt.crop}-${alt.disease}`}
                    className="tabular inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-arisi-100 border border-arisi-300 text-xs font-semibold text-mai-700"
                  >
                    {diseaseLabel(t, alt.disease)}
                    <span className="text-mai-500">{confidencePercent(alt.confidence)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-mai-500 mt-2">{t('result_alternatives_help')}</p>
            </div>
          )}

          {/* Uncertainty is stated plainly, every time (CLAUDE.md section 13) —
              a footer strip within the same card, not a card of its own. */}
          <div className="mt-4 pt-4 border-t border-arisi-200 text-sm text-mai-700">
            <p>
              <span aria-hidden="true">ℹ </span>
              {t('result_uncertainty')}
            </p>
            {lowConfidence && (
              <p className="mt-1.5 font-semibold text-manjal-700">{t('result_low_confidence')}</p>
            )}
          </div>
        </div>
      </section>

      {/* ---- No verified treatment: say so, plainly, and stop there. ------ */}
      {treatment && !treatment.verified && (
        <section className="card border-manjal-300 bg-manjal-100/40 p-5">
          <h2 className="text-xl font-display font-bold mb-2 text-mai-900">
            {t('result_treatment')}
          </h2>
          <p className="font-semibold text-mai-800">
            <span aria-hidden="true">⚠ </span>
            {t('result_unverified')}
          </p>
          <p className="mt-3 leading-relaxed text-mai-800">{treatment.recommendation}</p>
        </section>
      )}

      {/* ---- Verified guidance, grouped by what a farmer does with it ----- */}
      {treatment && treatment.verified && (
        <>
          {(treatment.summary || treatment.symptoms || treatment.cause) && (
            <section className="card p-5 space-y-4">
              {treatment.summary && (
                <p className="text-lg leading-relaxed text-mai-900">{treatment.summary}</p>
              )}

              {treatment.symptoms && (
                <div className={treatment.summary ? 'pt-4 border-t border-arisi-200' : ''}>
                  <h2 className="eyebrow mb-1">{t('result_symptoms')}</h2>
                  <p className="text-sm text-mai-500 mb-2">{t('result_symptoms_help')}</p>
                  <p className="leading-relaxed text-mai-800">{treatment.symptoms}</p>
                </div>
              )}

              {treatment.cause && (
                <div className={treatment.summary || treatment.symptoms ? 'pt-4 border-t border-arisi-200' : ''}>
                  <h2 className="eyebrow mb-1">{t('result_cause')}</h2>
                  <p className="leading-relaxed text-mai-800">{treatment.cause}</p>
                </div>
              )}
            </section>
          )}

          {treatment.immediate_actions?.length > 0 && (
            <section className="card border-pachai-300 p-5">
              <h2 className="text-xl font-display font-bold mb-4 text-mai-900">
                {t('result_actions')}
              </h2>
              <AdviceList items={treatment.immediate_actions} ordered />
            </section>
          )}

          {(treatment.prevention?.length > 0 || treatment.expert_note || treatment.source) && (
            <section className="card p-5 space-y-4">
              {treatment.prevention?.length > 0 && (
                <div>
                  <h2 className="eyebrow mb-3">{t('result_prevention')}</h2>
                  <AdviceList items={treatment.prevention} />
                </div>
              )}

              {treatment.expert_note && (
                <div className={treatment.prevention?.length > 0 ? 'pt-4 border-t border-arisi-200' : ''}>
                  <h2 className="eyebrow mb-1">{t('result_expert')}</h2>
                  <p className="leading-relaxed text-mai-800">{treatment.expert_note}</p>
                </div>
              )}

              {treatment.source && (
                <p className="text-xs text-mai-500 pt-3 border-t border-arisi-200">
                  <span className="font-semibold">{t('result_source')}: </span>
                  {treatment.source}
                </p>
              )}
            </section>
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
