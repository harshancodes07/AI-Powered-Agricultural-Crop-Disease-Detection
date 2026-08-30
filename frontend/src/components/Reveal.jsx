import { useInView } from '../hooks/useInView'

/**
 * Fades and lifts its children into place the first time they cross into the
 * viewport. `as` lets it wrap a section, an article, or a plain div without
 * an extra nesting element.
 */
export default function Reveal({ children, as: As = 'div', delay = 0, className = '' }) {
  const [ref, inView] = useInView()

  return (
    <As
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </As>
  )
}
