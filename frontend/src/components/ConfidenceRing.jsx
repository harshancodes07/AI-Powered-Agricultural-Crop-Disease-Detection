/*
 * A ring, not a dial — it shows how much of the model's certainty budget
 * went to this answer, not a speedometer implying "how true" the diagnosis
 * is. Paired everywhere it's used with the same text caveat the app states
 * elsewhere: confidence is about the model, not the disease.
 */
export default function ConfidenceRing({ value, size = 96, stroke = 10, tone = 'pachai' }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const filled = Math.max(0, Math.min(1, value)) * circumference

  const COLORS = {
    pachai: '#2E6B41',
    manjal: '#9A6C05',
    semmann: '#873223'
  }
  const ringColor = COLORS[tone] || COLORS.pachai

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E7D9BE"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference - filled}`}
        // Start at 12 o'clock, not 3 — reads as "filling up", not a pie slice.
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="font-display font-bold tabular"
        style={{ fontSize: size * 0.24, fill: '#2A1D18' }}
      >
        {Math.round(value * 100)}%
      </text>
    </svg>
  )
}
