import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import StatusBadge from '../components/StatusBadge'
import { all, remove } from '../offline/queue'
import { onSyncChange, syncPending } from '../offline/sync'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { cropLabel, formatDate } from '../utils/format'

/**
 * Everything captured on this device, queued or sent.
 * Reads from IndexedDB, so it works with no connection at all.
 */
export default function History() {
  const { t, i18n } = useTranslation()
  const online = useOnlineStatus()
  const routeState = useLocation().state

  const [records, setRecords] = useState([])
  const [syncing, setSyncing] = useState(false)

  const refresh = useCallback(() => {
    all().then(setRecords).catch(() => setRecords([]))
  }, [])

  useEffect(() => {
    refresh()
    return onSyncChange(refresh)
  }, [refresh])

  async function handleSync() {
    setSyncing(true)
    await syncPending()
    setSyncing(false)
    refresh()
  }

  const pendingCount = records.filter((r) => r.status !== 'SYNCED').length

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t('history_title')}</h1>

      {routeState?.justQueued && (
        <p role="status" className="card border-amber-300 bg-amber-50 p-4 text-amber-900">
          <span aria-hidden="true">⏳ </span>
          {t('capture_saved_offline')}
        </p>
      )}

      {online && pendingCount > 0 && (
        <button type="button" onClick={handleSync} disabled={syncing} className="btn-primary w-full">
          {syncing ? t('history_syncing') : t('history_sync_now')}
        </button>
      )}

      {records.length === 0 ? (
        <p className="card p-6 text-center text-slate-700">{t('history_empty')}</p>
      ) : (
        <ul className="space-y-3">
          {records.map((record) => (
            <li key={record.clientUuid} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-lg">{cropLabel(t, record.cropType)}</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(record.createdAt, i18n.language)}
                  </p>
                  {record.error && (
                    <p className="text-sm text-red-800 mt-1 font-semibold">{record.error}</p>
                  )}
                </div>
                <StatusBadge status={record.status} />
              </div>

              <div className="flex flex-wrap gap-3 mt-3">
                {record.serverId && (
                  <Link
                    to={`/farmer/report/${record.serverId}`}
                    className="btn-secondary flex-1 min-w-[8rem]"
                  >
                    {t('history_view')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => remove(record.clientUuid).then(refresh)}
                  className="btn-quiet"
                >
                  {t('history_delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
