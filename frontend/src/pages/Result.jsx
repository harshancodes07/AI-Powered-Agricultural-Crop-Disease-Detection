import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resolveAssetUrl } from '../services/api'

import AdviceList from '../components/AdviceList'
import ConfidenceRing from '../components/ConfidenceRing'
import SeverityBadge, { SeverityHelp } from '../components/SeverityBadge'
import {
  LOW_CONFIDENCE_THRESHOLD,
  confidencePercent,
  cropLabel,
  diseaseLabel,
  formatDate
} from '../utils/format'

const RING_TONE = { high: 'semmann', moderate: 'manjal', low: 'pachai', none: 'pachai' }

/**
 * Shows one prediction and its verified treatment.
 *
 * The image and the diagnosis are laid out as one connected unit — a two-up
 * grid on a wide screen, stacked on a phone — because they answer the same
 * question ("what am I looking at") and reading them as two unrelated boxes
 * was the whole complaint. Everything below that follows the order a farmer
 * actually wants: what it means, what else it could be, what to do now,
 * what to do later.
 *
 * `detail` normally arrives as router state straight after an upload, but it
 * can also be passed as a prop so a stored report renders identically.
 */
export default function Result({ detail: detailProp }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const detail = detailProp ?? location.state?.detail

  if (!detail) return <Navigate to="/farmer/capture" replace />

  const { report, prediction, treatment } = detail
  const cropUnsupported = prediction?.crop_supported === false
  const healthy = prediction?.disease === 'healthy'
  const lowConfidence =
    prediction != null && prediction.confidence < LOW_CONFIDENCE_THRESHOLD

  const BackLink = () => (
    <Link
      to="/farmer/history"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-mai-700 hover:text-mai-900"
    >
      <span aria-hidden="true">←</span>
      {t('result_back')}
    </Link>
  )

  if (!prediction) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <BackLink />
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

  if (cropUnsupported) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <BackLink />
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

  const severity = treatment?.severity
  const ringTone = RING_TONE[severity] || 'pachai'

  return (
    <div className="max-w-[1180px] mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink />
        <p className="tabular text-sm text-mai-500">
          {t('result_report_id')} #{report.id} · {formatDate(report.created_at, i18n.language)}
        </p>
      </div>

      <h1 className="text-2xl md:text-3xl font-display font-bold text-mai-900">
        {t('result_title')}
      </h1>

      {/* ---- The hero: image and diagnosis as one connected unit --------- */}
      <div className="grid md:grid-cols-2 gap-5 md:gap-8 items-stretch">
        {report.image_url && (
          <div className="relative card-kolam overflow-hidden min-h-[16rem]">
            <img
              src={resolveAssetUrl(report.image_url)}
              alt=""
              className="w-full h-full min-h-[16rem] max-h-[28rem] object-cover"
            />
            <a
              href={resolveAssetUrl(report.image_url)}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mai-900/80 text-arisi-50 text-xs font-semibold backdrop-blur-sm hover:bg-mai-900"
            >
              <span aria-hidden="true">⤢</span>
              {t('result_view_full')}
            </a>
          </div>
        )}

        <div className="card p-6 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="font-semibold text-mai-700">
              <span aria-hidden="true">{healthy ? '✓ ' : '⚠ '}</span>
              {healthy ? t('result_healthy') : t('result_detected')}
            </p>
            {!healthy && <SeverityBadge severity={severity} />}
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-bold text-mai-900 mb-1">
            {healthy ? cropLabel(t, prediction.crop) : diseaseLabel(t, prediction.disease)}
          </h2>

          {!healthy && <SeverityHelp severity={severity} />}

          <div className="flex items-center gap-4 mt-5 pt-5 border-t border-arisi-200">
            <ConfidenceRing value={prediction.confidence} tone={healthy ? 'pachai' : ringTone} />
            <div className="min-w-0">
              <p className="text-xs font-display font-semibold uppercase tracking-wide text-mai-500">
                {t('result_confidence')}
              </p>
              <p className="text-sm text-mai-700 mt-0.5">
                {cropLabel(t, prediction.crop)} · {prediction.model_version}
              </p>
              {lowConfidence && (
                <p className="text-sm font-semibold text-manjal-700 mt-1">
                  {t('result_low_confidence')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- What this result means — the explainer, inline, not a
              detached sidebar card ------------------------------------- */}
      <section className="card p-6">
        <h2 className="eyebrow mb-4">{t('result_understanding_title')}</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-sm text-mai-700 leading-relaxed">
          <p>{t('sidebar_result_confidence')}</p>
          <p>{t('sidebar_result_alternatives')}</p>
          <p>{t('sidebar_result_expert')}</p>
        </div>
        <p className="text-xs text-mai-500 mt-4 pt-4 border-t border-arisi-200">
          <span aria-hidden="true">ℹ </span>
          {t('result_uncertainty')}
        </p>
      </section>

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

      {treatment && treatment.verified && (
        <>
          {/* ---- Uncertainty (alternatives) beside action — two sides of
                  the same coin: not sure exactly what it is, but here's what
                  to do regardless. ---------------------------------------- */}
          {(prediction.alternatives?.length > 0 || treatment.immediate_actions?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-5 md:gap-8 items-start">
              {prediction.alternatives?.length > 0 && (
                <section className="card p-6">
                  <h2 className="text-lg font-display font-bold text-mai-900 mb-1">
                    {t('result_alternatives')}
                  </h2>
                  <p className="text-sm text-mai-500 mb-4">{t('result_alternatives_help')}</p>
                  <ul className="space-y-3">
                    {prediction.alternatives.map((alt) => (
                      <li key={`${alt.crop}-${alt.disease}`}>
                        <div className="flex justify-between text-sm font-semibold mb-1 gap-3">
                          <span className="min-w-0 truncate text-mai-800">
                            {diseaseLabel(t, alt.disease)}
                          </span>
                          <span className="tabular shrink-0 text-mai-600">
                            {confidencePercent(alt.confidence)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-arisi-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-arisi-400"
                            style={{ width: `${Math.max(alt.confidence * 100, 2)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {treatment.immediate_actions?.length > 0 && (
                <section className="card border-pachai-300 p-6">
                  <h2 className="text-lg font-display font-bold mb-4 text-mai-900">
                    {t('result_actions')}
                  </h2>
                  <AdviceList items={treatment.immediate_actions} ordered />
                </section>
              )}
            </div>
          )}

          {(treatment.summary || treatment.symptoms || treatment.cause) && (
            <section className="card p-6 space-y-4">
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

          {(treatment.prevention?.length > 0 || treatment.expert_note || treatment.source) && (
            <section className="card p-6 space-y-4">
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

      <div className="flex flex-wrap gap-3">
        <Link to="/farmer/capture" className="btn-primary flex-1 min-w-[12rem]">
          {t('result_new_report')}
        </Link>
        <Link to="/farmer/history" className="btn-secondary flex-1 min-w-[12rem]">
          {t('nav_history')}
        </Link>
      </div>
    </div>
  )
}
