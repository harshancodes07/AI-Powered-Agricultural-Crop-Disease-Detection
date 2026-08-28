// Every network call to the backend goes through here.
// Requests use same-origin paths; Vite proxies them to FastAPI in development.

export class NetworkError extends Error {}
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(path, options)
  } catch (err) {
    // A genuine connectivity failure — the caller should fall back to the
    // offline queue rather than showing an error.
    throw new NetworkError(err.message)
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : detail
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(detail, response.status)
  }
  return response.json()
}

export function getHealth() {
  return request('/api/health')
}

export function createReport({ file, cropType, language, latitude, longitude, region, clientUuid }) {
  const form = new FormData()
  form.append('file', file)
  form.append('crop_type', cropType)
  form.append('language', language)
  if (latitude != null) form.append('latitude', latitude)
  if (longitude != null) form.append('longitude', longitude)
  if (region) form.append('region', region)
  if (clientUuid) form.append('client_uuid', clientUuid)
  return request('/api/reports', { method: 'POST', body: form })
}

export function syncReports(reports) {
  return request('/api/reports/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reports })
  })
}

export function getReport(id) {
  return request(`/api/reports/${id}`)
}

export function listReports(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  )
  return request(`/api/reports?${qs}`)
}

function dashboard(endpoint, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  )
  return request(`/api/dashboard/${endpoint}?${qs}`)
}

export const getSummary = (p) => dashboard('summary', p)
export const getMapPoints = (p) => dashboard('map', p)
export const getDiseaseBreakdown = (p) => dashboard('diseases', p)
export const getTrends = (p) => dashboard('trends', p)
export const getCrops = () => dashboard('crops')
