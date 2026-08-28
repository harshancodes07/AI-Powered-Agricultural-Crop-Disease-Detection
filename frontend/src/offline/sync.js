// Drains the offline queue to the backend.
//
// Safe to call at any time and from more than one place (the online event, a
// manual button, app start): a run in progress short-circuits, and the backend
// deduplicates on clientUuid, so a half-finished sync that is retried cannot
// create duplicate reports.

import { syncReports } from '../services/api'
import { STATUS, blobToBase64, pending, update } from './queue'

let running = false
const listeners = new Set()

/** Subscribe to queue changes. Returns an unsubscribe function. */
export function onSyncChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(state) {
  listeners.forEach((listener) => listener(state))
}

export async function syncPending() {
  if (running) return { skipped: true }
  if (!navigator.onLine) return { skipped: true, offline: true }

  const queued = await pending()
  if (queued.length === 0) {
    notify({ running: false, pending: 0 })
    return { synced: 0, failed: 0 }
  }

  running = true
  notify({ running: true, pending: queued.length })

  try {
    // Mark everything in flight so the UI can show progress.
    await Promise.all(
      queued.map((record) => update(record.clientUuid, { status: STATUS.UPLOADING }))
    )

    const payload = await Promise.all(
      queued.map(async (record) => ({
        client_uuid: record.clientUuid,
        crop_type: record.cropType,
        language: record.language,
        latitude: record.latitude,
        longitude: record.longitude,
        region: record.region,
        image_base64: await blobToBase64(record.image),
        created_at: record.createdAt
      }))
    )

    const { results } = await syncReports(payload)

    let synced = 0
    let failed = 0
    for (const result of results) {
      if (result.status === 'SYNCED') {
        synced += 1
        await update(result.client_uuid, {
          status: STATUS.SYNCED,
          serverId: result.report_id,
          error: null
        })
      } else {
        failed += 1
        // Back to PENDING, not FAILED-and-forgotten: it stays retryable.
        await update(result.client_uuid, {
          status: STATUS.PENDING,
          error: result.error || 'Sync failed'
        })
      }
    }

    notify({ running: false, pending: (await pending()).length, synced, failed })
    return { synced, failed }
  } catch (err) {
    // Network dropped mid-sync. Put everything back in the queue.
    await Promise.all(
      queued.map((record) =>
        update(record.clientUuid, { status: STATUS.PENDING, error: err.message })
      )
    )
    notify({ running: false, pending: queued.length, error: err.message })
    return { error: err.message }
  } finally {
    running = false
  }
}

/** Wire up automatic syncing. Call once, at app start. */
export function startAutoSync() {
  const attempt = () => {
    syncPending().catch(() => {
      /* handled inside syncPending */
    })
  }

  window.addEventListener('online', attempt)
  // Coming back to the tab is another good moment to try.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) attempt()
  })

  if (navigator.onLine) attempt()

  return () => window.removeEventListener('online', attempt)
}
