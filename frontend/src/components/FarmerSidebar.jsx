import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import PlantMotif from './PlantMotif'
import { STATUS } from '../offline/queue'
import StatusBadge from './StatusBadge'

/*
 * The desktop-only context column.
 *
 * On a phone the working screens (capture, history, a result) are the
 * whole story — there is no room for anything else, and there shouldn't be.
 * On a desk monitor the same screens have real width going spare, and that
 * space is spent on reference material specific to what that screen is
 * doing, not a generic "related links" filler panel.
 *
 * Kept inside the layout rather than each page, so no working page had to
 * change to gain a desktop treatment.
 */
export default function FarmerSidebar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  if (pathname === '/farmer') return <HomePanel t={t} />
  if (pathname.startsWith('/farmer/capture')) return <CapturePanel t={t} />
  if (pathname.startsWith('/farmer/history')) return <HistoryPanel t={t} />
  // Result pages build their own full-width layout with this content moved
  // inline (see pages/Result.jsx), so there is no sidebar to fill here.
  return null
}

function Panel({ children }) {
  return <div className="space-y-6">{children}</div>
}

function HomePanel({ t }) {
  return (
    <Panel>
      <section className="card p-6">
        <p className="eyebrow mb-4">{t('sidebar_home_trust_title')}</p>
        <ul className="space-y-3 text-sm text-mai-700">
          {['sidebar_home_trust_1', 'sidebar_home_trust_2', 'sidebar_home_trust_3'].map((key) => (
            <li key={key} className="flex gap-2.5">
              <span aria-hidden="true" className="text-pachai-700 font-bold shrink-0">
                ●
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="card-kolam p-6">
        <p className="eyebrow mb-3">{t('sidebar_home_title')}</p>
        <p className="text-sm text-mai-700 leading-relaxed">{t('advisory_1')}</p>
      </section>

      <Link
        to="/dashboard/map"
        className="btn-quiet w-full justify-center text-sm"
      >
        {t('sidebar_home_map_cta')}
      </Link>
    </Panel>
  )
}

const TIP_KEYS = ['sidebar_capture_tips_1', 'sidebar_capture_tips_2', 'sidebar_capture_tips_3', 'sidebar_capture_tips_4']
const HOW_KEYS = ['sidebar_capture_how_1', 'sidebar_capture_how_2', 'sidebar_capture_how_3']
const HOW_MOTIFS = ['banana', 'neem', 'paddy']

function CapturePanel({ t }) {
  return (
    <Panel>
      <section className="card p-6">
        <p className="eyebrow mb-4">{t('sidebar_capture_tips_title')}</p>
        <ul className="space-y-3 text-sm text-mai-700">
          {TIP_KEYS.map((key) => (
            <li key={key} className="flex gap-2.5">
              <span aria-hidden="true" className="text-manjal-500 font-bold shrink-0">
                ●
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <p className="eyebrow mb-4">{t('sidebar_capture_how_title')}</p>
        <ul className="space-y-4">
          {HOW_KEYS.map((key, i) => (
            <li key={key} className="flex gap-3 items-start text-sm text-mai-700">
              <span className="shrink-0 w-9 h-9 rounded-full bg-pachai-50 flex items-center justify-center">
                <PlantMotif name={HOW_MOTIFS[i]} size={20} strokeWidth={2} className="text-pachai-700" />
              </span>
              <span className="pt-1.5">{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>
    </Panel>
  )
}

const STATUS_KEYS = {
  [STATUS.PENDING]: 'sidebar_history_pending',
  [STATUS.UPLOADING]: 'sidebar_history_uploading',
  [STATUS.SYNCED]: 'sidebar_history_synced',
  [STATUS.FAILED]: 'sidebar_history_failed'
}

function HistoryPanel({ t }) {
  return (
    <Panel>
      <section className="card p-6">
        <p className="eyebrow mb-4">{t('sidebar_history_title')}</p>
        <ul className="space-y-4">
          {Object.entries(STATUS_KEYS).map(([status, key]) => (
            <li key={status}>
              <StatusBadge status={status} />
              <p className="text-sm text-mai-700 mt-2 leading-relaxed">{t(key)}</p>
            </li>
          ))}
        </ul>
      </section>
    </Panel>
  )
}

