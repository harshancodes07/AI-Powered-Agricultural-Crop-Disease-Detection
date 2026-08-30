import { useTranslation } from 'react-i18next'

/*
 * The scrolling advisory line every agriculture department runs during a
 * season. It carries seasonal guidance that is true regardless of what the
 * model says, which is exactly the kind of thing a farmer opening the app
 * should catch without going looking for it.
 *
 * The list is duplicated so the marquee loops seamlessly at -50%; the copy
 * is hidden from assistive tech, and the original is read once instead.
 */
const ADVISORY_KEYS = ['advisory_1', 'advisory_2', 'advisory_3']

export default function AdvisoryTicker() {
  const { t } = useTranslation()
  const items = ADVISORY_KEYS.map((key) => t(key))

  const Row = ({ hidden }) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((text, i) => (
        <li key={`${text}-${i}`} className="flex items-center whitespace-nowrap px-6 py-2">
          <span aria-hidden="true" className="mr-3 text-manjal-500">◆</span>
          {text}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="bg-semmann-800 text-arisi-100 text-sm overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-stretch">
        <p className="hidden sm:flex items-center shrink-0 bg-manjal-500 text-kummayam-900 px-4 font-display font-bold uppercase tracking-wider text-xs">
          {t('advisory_label')}
        </p>
        {/* Pausing on hover lets someone actually finish reading a line. */}
        <div className="flex overflow-hidden group">
          <div className="flex animate-ticker group-hover:[animation-play-state:paused]">
            <Row />
            <Row hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
