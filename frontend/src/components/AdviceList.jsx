/** A numbered or bulleted list of short, concrete steps. */
export default function AdviceList({ items, ordered = false }) {
  if (!items || items.length === 0) return null

  const List = ordered ? 'ol' : 'ul'
  return (
    <List className={`space-y-2.5 ${ordered ? 'list-none' : ''}`}>
      {items.map((item, index) => (
        <li key={item} className="flex gap-3">
          <span
            aria-hidden="true"
            className={
              ordered
                ? 'shrink-0 w-7 h-7 rounded-full bg-brand-700 text-white font-bold grid place-items-center text-sm'
                : 'shrink-0 text-brand-700 font-bold'
            }
          >
            {ordered ? index + 1 : '•'}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </List>
  )
}
