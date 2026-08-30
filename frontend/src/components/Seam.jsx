/*
 * The join between two sections, drawn as a hand-set horizon rather than a
 * hard rectangular edge — an organic curve instead of a straight seam, cut
 * from whichever two colours meet there.
 *
 * `flip` alternates the curve's direction section to section, the way a
 * real horizon never repeats itself exactly.
 */
export default function Seam({ from, to, flip = false, className = '' }) {
  return (
    <div className={`seam relative ${className}`} style={{ background: from }} aria-hidden="true">
      <svg
        className="absolute inset-x-0 bottom-0 w-full h-full"
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      >
        <path
          d="M0 60V22C60 4 110 40 170 26 230 12 280 46 340 30 370 22 390 30 400 26V60z"
          fill={to}
        />
      </svg>
    </div>
  )
}
