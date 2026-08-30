/*
 * The signature element.
 *
 * A pulli kolam is drawn at the threshold of a Tamil house every dawn: a
 * lattice of dots (pulli) with a single unbroken line looped around them.
 * It is a greeting and a sign that the household is tending things.
 *
 * Here it draws itself, stroke by stroke, in the two places where the app
 * asks a farmer to wait or to begin — so the waiting is the welcome.
 *
 * `pathLength="1"` normalises every path so one dash offset animates them
 * all regardless of their real geometry.
 */

// The four-lobed sikku loop, plus the inner diamond, drawn around 5 dots.
const LOOP =
  'M100 60C130 30 170 70 140 100c30 30-10 70-40 40-30 30-70-10-40-40C30 70 70 30 100 60z'
const DIAMOND = 'M100 76 124 100 100 124 76 100z'
const PULLI = [
  [100, 100], [100, 62], [138, 100], [100, 138], [62, 100]
]

export default function Kolam({
  size = 200,
  className = '',
  stroke = 'currentColor',
  strokeWidth = 5,
  animate = true,
  loop = false,
  title
}) {
  const drawClass = animate ? 'animate-kolam' : ''
  const style = animate
    ? { strokeDasharray: 1, strokeDashoffset: 1, ...(loop ? { animationIterationCount: 'infinite' } : {}) }
    : undefined

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      fill="none"
    >
      <path
        d={LOOP}
        pathLength="1"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={drawClass}
        style={style}
      />
      <path
        d={DIAMOND}
        pathLength="1"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={drawClass}
        style={style ? { ...style, animationDelay: '0.5s' } : undefined}
      />
      {/* The dots land after the line passes them, like flour dropped first. */}
      {PULLI.map(([cx, cy], i) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={strokeWidth * 0.8}
          fill={stroke}
          className={animate ? 'animate-pulli' : ''}
          style={
            animate
              ? { opacity: 0, transformOrigin: `${cx}px ${cy}px`, animationDelay: `${0.9 + i * 0.11}s` }
              : undefined
          }
        />
      ))}
    </svg>
  )
}

/**
 * The waiting state, used while the model looks at a photo. A spinner says
 * "the machine is busy"; a kolam being drawn says "someone is attending to
 * this", which is closer to what is actually happening.
 */
export function KolamLoader({ label, className = '' }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center gap-4 py-8 ${className}`}>
      <Kolam size={128} stroke="#2E6B41" strokeWidth={6} loop />
      <p className="font-display font-semibold text-pachai-800 text-center">{label}</p>
    </div>
  )
}
