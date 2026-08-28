/** One headline number on the dashboard. */
export default function KpiCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1 break-words">{value}</p>
      {hint && <p className="text-sm text-slate-600 mt-1">{hint}</p>}
    </div>
  )
}
