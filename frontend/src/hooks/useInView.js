import { useEffect, useRef, useState } from 'react'

/**
 * True once the element has entered the viewport. One-shot: it does not
 * revert on scroll-out, so a story section that has already told itself
 * doesn't flicker if the reader scrolls back up past it.
 */
export function useInView(options) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    // Reduced motion: everything should simply be present, not deferred.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px', ...options }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [options])

  return [ref, inView]
}
