/**
 * A plain horizontal bar chart in HTML — no charting library needed for this.
 * Each bar carries its own number as text, so the chart is readable without
 * relying on bar length or colour alone.
 */
export default function BarChart({ data, emptyLabel }) {
  if (!data || data.length === 0) {
    return <p className="text-mai-600 p-4">{emptyLabel}</p>
  }

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <li key={item.label}>
          <div className="flex justify-between text-sm font-semibold mb-1 gap-3">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="tabular shrink-0">{item.value}</span>
          </div>
          <div className="h-3 rounded-full bg-arisi-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-pachai-700"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
