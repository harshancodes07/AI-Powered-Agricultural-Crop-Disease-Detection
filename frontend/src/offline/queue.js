// Offline report queue, backed by IndexedDB.
//
// Why IndexedDB and not localStorage: we store the actual image Blob, which
// can be several megabytes. localStorage only holds strings and caps out at
// around 5 MB for the whole origin.
//
// The rule this file exists to guarantee (CLAUDE.md section 22): a report the
// farmer captured is never lost because the network was down.

import { openDB } from 'idb'

const DB_NAME = 'cropcare'
const DB_VERSION = 1
const STORE = 'reports'

// Status machine. A report moves PENDING -> UPLOADING -> SYNCED, or lands on
// FAILED and stays in the queue so it can be retried.
export const STATUS = {
  PENDING: 'PENDING',
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  SYNCED: 'SYNCED',
  FAILED: 'FAILED'
}

function dbPromise() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'clientUuid' })
      store.createIndex('status', 'status')
      store.createIndex('createdAt', 'createdAt')
    }
  })
}

function newUuid() {
  // crypto.randomUUID needs a secure context; over plain HTTP on a LAN address
  // it may be missing, so fall back to random bytes.
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Save a captured report locally. Returns the stored record. */
export async function enqueue({ file, cropType, language, latitude, longitude, region }) {
  const record = {
    clientUuid: newUuid(),
    // Stored as a Blob; IndexedDB handles binary natively.
    image: file,
    imageType: file.type,
    cropType,
    language,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    region: region ?? null,
    status: STATUS.PENDING,
    error: null,
    result: null,
    createdAt: new Date().toISOString()
  }
  const db = await dbPromise()
  await db.put(STORE, record)
  return record
}

export async function all() {
  const db = await dbPromise()
  const records = await db.getAll(STORE)
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function get(clientUuid) {
  const db = await dbPromise()
  return db.get(STORE, clientUuid)
}

export async function update(clientUuid, changes) {
  const db = await dbPromise()
  const existing = await db.get(STORE, clientUuid)
  if (!existing) return null
  const updated = { ...existing, ...changes }
  await db.put(STORE, updated)
  return updated
}

export async function remove(clientUuid) {
  const db = await dbPromise()
  await db.delete(STORE, clientUuid)
}

/**
 * Reports still waiting to reach the server.
 *
 * UPLOADING and PROCESSING count as pending too: if the tab was closed or
 * reloaded mid-sync, a report would otherwise be stranded in that state forever
 * and never retried. Re-sending is safe because the backend deduplicates on
 * clientUuid.
 */
export async function pending() {
  const records = await all()
  return records.filter((r) => r.status !== STATUS.SYNCED)
}

export async function pendingCount() {
  return (await pending()).length
}

/** Convert a stored Blob to base64 for the JSON sync endpoint. */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const dataUrl = reader.result
      resolve(String(dataUrl).split(',')[1]) // drop the "data:...;base64," prefix
    }
    reader.readAsDataURL(blob)
  })
}
