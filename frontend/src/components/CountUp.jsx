import { useEffect, useRef, useState } from 'react'

/**
 * Counts a headline number up on first paint. Officials scan a dashboard for
 * what changed; a number that moves draws the eye to the tile that matters.
 * Non-numeric values (a disease name) are passed straight through, and the
 * animation is skipped entirely when the reader has asked for reduced motion.
 */
export default function CountUp({ value, duration = 900 }) {
  const numeric = typeof value === 'number' && Number.isFinite(value)
  const [shown, setShown] = useState(numeric ? 0 : value)
  const frame = useRef()

  useEffect(() => {
    if (!numeric) {
      setShown(value)
      return undefined
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || value === 0) {
      setShown(value)
      return undefined
    }

    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      // Ease-out: fast at first, settling on the real figure.
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration, numeric])

  return <>{shown}</>
}
