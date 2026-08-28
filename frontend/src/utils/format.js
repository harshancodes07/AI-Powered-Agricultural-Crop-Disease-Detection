// Small display helpers shared by the farmer app and the dashboard.

/** Translate a disease key like "early_blight", falling back to a readable form. */
export function diseaseLabel(t, key) {
  if (!key) return '—'
  const translationKey = `disease_${key}`
  const translated = t(translationKey)
  if (translated !== translationKey) return translated
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function cropLabel(t, key) {
  if (!key) return '—'
  const translationKey = `crop_${key}`
  const translated = t(translationKey)
  return translated !== translationKey ? translated : key
}

export function confidencePercent(value) {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

export function formatDate(iso, locale = 'en') {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Below this, we tell the farmer explicitly that the model is unsure.
export const LOW_CONFIDENCE_THRESHOLD = 0.8
