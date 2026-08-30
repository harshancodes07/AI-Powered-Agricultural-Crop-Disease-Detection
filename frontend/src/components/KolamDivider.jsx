/*
 * The rule between sections, drawn as a repeating kolam border. A plain
 * hairline would separate two blocks; this one carries the same dot-and-loop
 * grammar as the rest of the interface, so the seams look intentional.
 */
export default function KolamDivider({ className = '', tone = 'earth' }) {
  const stroke = tone === 'light' ? 'rgba(251,246,234,.55)' : 'rgba(160,62,42,.45)'
  const dot = tone === 'light' ? 'rgba(224,163,23,.9)' : '#E0A317'

  return (
    <div className={`w-full h-4 ${className}`} aria-hidden="true">
      <svg width="100%" height="16" viewBox="0 0 96 16" preserveAspectRatio="none" fill="none">
        <defs>
          <pattern id="kolam-rule" width="24" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M0 8c6-8 12 8 18 0"
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="21" cy="8" r="1.8" fill={dot} />
          </pattern>
        </defs>
        <rect width="96" height="16" fill="url(#kolam-rule)" />
      </svg>
    </div>
  )
}
