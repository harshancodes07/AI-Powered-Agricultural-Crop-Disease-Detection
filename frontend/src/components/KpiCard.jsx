import CountUp from './CountUp'

/** One headline number on the dashboard. Widens to fill its grid cell, so a
 * six-across row on a large monitor never looks like four cards padded out
 * with empty ones. */
export default function KpiCard({ label, value, hint, tone = 'default' }) {
  const numeric = typeof value === 'number'

  return (
    <div className={`card p-5 ${tone === 'alert' ? 'border-semmann-400' : ''}`}>
      <p className="eyebrow">{label}</p>
      <p
        className={`text-3xl xl:text-4xl font-display font-bold mt-2 break-words tabular ${
          tone === 'alert' ? 'text-semmann-700' : 'text-mai-900'
        }`}
      >
        {numeric ? <CountUp value={value} /> : value}
      </p>
      {hint && <p className="text-sm text-mai-600 mt-1">{hint}</p>}
    </div>
  )
}
