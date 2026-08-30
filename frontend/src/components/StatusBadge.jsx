import { useTranslation } from 'react-i18next'

import { STATUS } from '../offline/queue'

// Status is conveyed by an icon AND a word, never by colour alone — colour-blind
// users and anyone in bright sunlight must still be able to read it.
const STYLES = {
  [STATUS.PENDING]: { icon: '⏳', className: 'bg-amber-100 text-amber-900 border-amber-300', key: 'status_pending' },
  [STATUS.UPLOADING]: { icon: '↑', className: 'bg-sky-100 text-sky-900 border-sky-300', key: 'status_uploading' },
  [STATUS.PROCESSING]: { icon: '⋯', className: 'bg-sky-100 text-sky-900 border-sky-300', key: 'status_processing' },
  [STATUS.SYNCED]: { icon: '✓', className: 'bg-pachai-100 text-pachai-900 border-pachai-300', key: 'status_synced' },
  [STATUS.FAILED]: { icon: '!', className: 'bg-red-100 text-red-900 border-red-300', key: 'status_failed' }
}

export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const style = STYLES[status] ?? STYLES[STATUS.PENDING]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${style.className}`}
    >
      <span aria-hidden="true">{style.icon}</span>
      {t(style.key)}
    </span>
  )
}
