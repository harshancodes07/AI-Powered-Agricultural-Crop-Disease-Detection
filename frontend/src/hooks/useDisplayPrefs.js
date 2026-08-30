import { useCallback, useEffect, useState } from 'react'

/*
 * Text size and contrast, persisted per device.
 *
 * Public-service sites carry these controls because their audience is
 * everybody — here that means a farmer reading a phone at midday in a field.
 * Both settings write to <html>, so they apply to the whole app including
 * anything rendered outside React (the Leaflet map, the PWA shell).
 */
const SCALE_KEY = 'cropcare.textScale'
const CONTRAST_KEY = 'cropcare.contrast'

export const SCALE_STEPS = [1, 1.15, 1.3]

function readStored(key, fallback, parse) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : parse(raw)
  } catch {
    // Private browsing, or storage disabled. The defaults are still correct.
    return fallback
  }
}

export function useDisplayPrefs() {
  const [scale, setScale] = useState(() =>
    readStored(SCALE_KEY, 1, (raw) => (SCALE_STEPS.includes(Number(raw)) ? Number(raw) : 1))
  )
  const [highContrast, setHighContrast] = useState(() =>
    readStored(CONTRAST_KEY, false, (raw) => raw === 'true')
  )

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(scale))
    try {
      localStorage.setItem(SCALE_KEY, String(scale))
    } catch { /* nothing to do — the setting just will not survive a reload */ }
  }, [scale])

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'normal'
    try {
      localStorage.setItem(CONTRAST_KEY, String(highContrast))
    } catch { /* as above */ }
  }, [highContrast])

  const stepScale = useCallback((direction) => {
    setScale((current) => {
      const next = SCALE_STEPS.indexOf(current) + direction
      return SCALE_STEPS[Math.min(Math.max(next, 0), SCALE_STEPS.length - 1)]
    })
  }, [])

  return {
    scale,
    stepScale,
    resetScale: useCallback(() => setScale(1), []),
    canGrow: scale !== SCALE_STEPS[SCALE_STEPS.length - 1],
    canShrink: scale !== SCALE_STEPS[0],
    highContrast,
    toggleContrast: useCallback(() => setHighContrast((v) => !v), [])
  }
}
