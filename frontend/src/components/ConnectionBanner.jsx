import { useTranslation } from 'react-i18next'

import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { usePendingCount } from '../hooks/usePendingCount'
import { syncPending } from '../offline/sync'

/**
 * Always-visible connection state plus the number of reports still queued.
 * Announced politely so a screen-reader user hears when the app goes offline.
 */
export default function ConnectionBanner() {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const [pending, refresh] = usePendingCount()

  if (online && pending === 0) return null

  const pendingText =
    pending > 0
      ? t(pending === 1 ? 'pending_count_one' : 'pending_count_other', { count: pending })
      : null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`px-4 py-3 text-sm font-semibold flex flex-wrap items-center justify-center gap-x-3 gap-y-2 ${
        online ? 'bg-amber-100 text-amber-900' : 'bg-slate-800 text-white'
      }`}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true">{online ? '⏳' : '⛔'}</span>
        {online ? pendingText : t('offline_banner')}
      </span>

      {online && pending > 0 && (
        <button
          type="button"
          onClick={() => syncPending().then(refresh)}
          className="underline underline-offset-2 font-bold min-h-[2.5rem] px-2"
        >
          {t('history_sync_now')}
        </button>
      )}

      {!online && pendingText && <span className="opacity-90">{pendingText}</span>}
    </div>
  )
}
