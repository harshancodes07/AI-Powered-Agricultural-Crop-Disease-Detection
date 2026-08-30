import { useTranslation } from 'react-i18next'

// Urgency is carried by an icon and a word as well as colour, so it reads
// correctly for colour-blind users and in bright sunlight. The four tones
// are a ramp through the site's own palette rather than generic red/amber —
// calm (pachai) -> watch (arisi/ink) -> caution (turmeric) -> alarm (red earth).
const STYLES = {
  high: { icon: '⚠', className: 'bg-semmann-100 text-semmann-800 border-semmann-400' },
  moderate: { icon: '!', className: 'bg-manjal-100 text-mai-900 border-manjal-500' },
  low: { icon: '👁', className: 'bg-arisi-200 text-mai-800 border-arisi-400' },
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
  return <p className="text-mai-700 mt-2">{t(`severity_${severity}_help`)}</p>
}
