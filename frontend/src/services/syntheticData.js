// Demo data used when the real backend can't be reached (e.g. this frontend
// deployed on its own with no live API behind it). Mirrors the shapes and
// aggregation rules in backend/app/api/routes/dashboard.py exactly, so the
// dashboard, map, reports table and analytics pages behave identically
// whether they're reading real rows or this pool.
//
// A fixed seed keeps the story consistent across reloads and across pages —
// the same "outbreak" districts show up on the map, in the summary's
// high-risk count and in the disease breakdown.

const CROPS = ['tomato', 'potato', 'corn', 'rice']
const DISEASE_BY_CROP = {
  tomato: ['early_blight', 'late_blight', 'leaf_mold', 'healthy'],
  potato: ['early_blight', 'late_blight', 'healthy'],
  corn: ['common_rust', 'northern_leaf_blight', 'healthy'],
  rice: ['leaf_blast', 'bacterial_leaf_blight', 'healthy']
}

// Tamil Nadu districts, roughly centred, used as report clusters.
const DISTRICTS = [
  { region: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
  { region: 'Madurai', lat: 9.9252, lon: 78.1198 },
  { region: 'Salem', lat: 11.6643, lon: 78.146 },
  { region: 'Tiruchirapalli', lat: 10.7905, lon: 78.7047 },
  { region: 'Erode', lat: 11.341, lon: 77.7172 },
  { region: 'Thanjavur', lat: 10.787, lon: 79.1378 },
  { region: 'Vellore', lat: 12.9165, lon: 79.1325 },
  { region: 'Dindigul', lat: 10.3624, lon: 77.9695 },
  { region: 'Theni', lat: 10.0104, lon: 77.4768 },
  { region: 'Cuddalore', lat: 11.748, lon: 79.7714 }
]

// Districts with a concentrated outbreak, so `high_risk_areas` and the map's
// clustering are not just uniform noise.
const OUTBREAKS = [
  { region: 'Thanjavur', crop: 'rice', disease: 'bacterial_leaf_blight', count: 6 },
  { region: 'Erode', crop: 'tomato', disease: 'late_blight', count: 5 },
  { region: 'Salem', crop: 'corn', disease: 'northern_leaf_blight', count: 4 }
]

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function buildReports() {
  const rng = mulberry32(20260902)
  const now = Date.now()
  const reports = []
  let id = 1

  const addReport = ({ district, crop, disease, daysAgo }) => {
    const jitterLat = (rng() - 0.5) * 0.3
    const jitterLon = (rng() - 0.5) * 0.3
    reports.push({
      id: id++,
      latitude: Number((district.lat + jitterLat).toFixed(5)),
      longitude: Number((district.lon + jitterLon).toFixed(5)),
      crop,
      disease,
      confidence: Number((0.72 + rng() * 0.27).toFixed(2)),
      region: district.region,
      created_at: new Date(now - daysAgo * 86400000 - Math.floor(rng() * 86400000)).toISOString()
    })
  }

  // Deliberate outbreak clusters — tight jitter so they land in the same
  // ~11km hotspot grid cell the backend uses.
  for (const outbreak of OUTBREAKS) {
    const district = DISTRICTS.find((d) => d.region === outbreak.region)
    for (let i = 0; i < outbreak.count; i++) {
      const jitterLat = (rng() - 0.5) * 0.05
      const jitterLon = (rng() - 0.5) * 0.05
      reports.push({
        id: id++,
        latitude: Number((district.lat + jitterLat).toFixed(5)),
        longitude: Number((district.lon + jitterLon).toFixed(5)),
        crop: outbreak.crop,
        disease: outbreak.disease,
        confidence: Number((0.75 + rng() * 0.24).toFixed(2)),
        region: district.region,
        created_at: new Date(now - Math.floor(rng() * 20) * 86400000).toISOString()
      })
    }
  }

  // Background noise: everyday scattered reports across all districts.
  for (let i = 0; i < 130; i++) {
    const district = pick(rng, DISTRICTS)
    const crop = pick(rng, CROPS)
    const disease = pick(rng, DISEASE_BY_CROP[crop])
    const daysAgo = Math.floor(rng() * 44)
    addReport({ district, crop, disease, daysAgo })
  }

  return reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

const REPORTS = buildReports()

const HOTSPOT_GRID = 0.1
const HOTSPOT_THRESHOLD = 3

function applyFilters(reports, { crop, disease, region, date_from, date_to } = {}) {
  return reports.filter((r) => {
    if (crop && r.crop !== crop) return false
    if (disease && r.disease !== disease) return false
    if (region && r.region !== region) return false
    if (date_from && r.created_at.slice(0, 10) < date_from) return false
    if (date_to && r.created_at.slice(0, 10) > date_to) return false
    return true
  })
}

export function syntheticSummary(filters) {
  const rows = applyFilters(REPORTS, filters)
  const total = rows.length
  const healthy = rows.filter((r) => r.disease === 'healthy').length
  const diseased = total - healthy

  const areas = new Set()
  const clusters = new Map()
  const diseaseCounts = new Map()

  for (const r of rows) {
    if (r.disease === 'healthy') continue
    diseaseCounts.set(r.disease, (diseaseCounts.get(r.disease) || 0) + 1)
    const cellLat = Math.round(r.latitude / HOTSPOT_GRID) * HOTSPOT_GRID
    const cellLon = Math.round(r.longitude / HOTSPOT_GRID) * HOTSPOT_GRID
    areas.add(`${cellLat},${cellLon}`)
    const key = `${r.disease}|${cellLat}|${cellLon}`
    clusters.set(key, (clusters.get(key) || 0) + 1)
  }

  let mostCommon = null
  let mostCommonCount = 0
  for (const [d, count] of diseaseCounts) {
    if (count > mostCommonCount) {
      mostCommon = d
      mostCommonCount = count
    }
  }

  const highRisk = [...clusters.values()].filter((c) => c >= HOTSPOT_THRESHOLD).length

  return {
    total_reports: total,
    affected_areas: areas.size,
    most_common_disease: mostCommon,
    most_common_disease_count: mostCommonCount,
    high_risk_areas: highRisk,
    healthy_reports: healthy,
    diseased_reports: diseased
  }
}

export function syntheticMapPoints(filters = {}) {
  const limit = filters.limit || 1000
  return applyFilters(REPORTS, filters)
    .slice(0, limit)
    .map((r) => ({ ...r }))
}

export function syntheticDiseaseBreakdown(filters) {
  const rows = applyFilters(REPORTS, { ...filters, disease: undefined })
  const counts = new Map()
  for (const r of rows) {
    if (r.disease === 'healthy') continue
    const key = `${r.disease}|${r.crop}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [disease, crop] = key.split('|')
      return { disease, crop, count }
    })
    .sort((a, b) => b.count - a.count)
}

export function syntheticTrends({ days = 30, crop, disease } = {}) {
  const rows = applyFilters(REPORTS, { crop, disease })
  const counts = new Map()
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    counts.set(day, (counts.get(day) || 0) + 1)
  }
  const today = new Date()
  const series = []
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(today.getTime() - offset * 86400000).toISOString().slice(0, 10)
    series.push({ date: day, count: counts.get(day) || 0 })
  }
  return series
}

export function syntheticCrops() {
  const counts = new Map()
  for (const r of REPORTS) {
    counts.set(r.crop, (counts.get(r.crop) || 0) + 1)
  }
  return [...counts.entries()].map(([crop, count]) => ({ crop, count }))
}
