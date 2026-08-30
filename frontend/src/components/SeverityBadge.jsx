import { useTranslation } from 'react-i18next'

// Urgency is carried by an icon and a word as well as colour, so it reads
// correctly for colour-blind users and in bright sunlight.
const STYLES = {
  high: { icon: '⚠', className: 'bg-red-100 text-red-900 border-red-400' },
  moderate: { icon: '!', className: 'bg-amber-100 text-amber-900 border-amber-400' },
  low: { icon: '👁', className: 'bg-sky-100 text-sky-900 border-sky-400' },
  none: { icon: '✓', className: 'bg-pachai-100 text-pachai-900 border-pachai-300' }
}

export default function SeverityBadge({ severity }) {
  const { t } = useTranslation()
  const level = STYLES[severity] ? severity : 'moderate'
  const style = STYLES[level]

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 font-bold ${style.className}`}
    >
      <span aria-hidden="true">{style.icon}</span>
      {t(`severity_${level}`)}
    </span>
  )
}

/** The one-line explanation of what that urgency means in practice. */
export function SeverityHelp({ severity }) {
  const { t } = useTranslation()
  if (!['high', 'moderate', 'low'].includes(severity)) return null
  return <p className="text-slate-700 mt-2">{t(`severity_${severity}_help`)}</p>
}
