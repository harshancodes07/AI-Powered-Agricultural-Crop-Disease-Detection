import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import CountUp from '../components/CountUp'
import Emblem from '../components/Emblem'
import Kolam from '../components/Kolam'
import LanguageSwitcher from '../components/LanguageSwitcher'
import PlantMotif from '../components/PlantMotif'
import Reveal from '../components/Reveal'
import Seam from '../components/Seam'

// The four-step pipeline this whole page walks through, in the order it
// actually happens — capture, model, reference, map. The numbering on the
// thread spine is legitimate here because this really is a fixed sequence,
// not a decorative counter.
const STEPS = [
  { key: 'step1', motif: 'banana' },
  { key: 'step2', motif: null }, // drawn with the real Kolam loading motif
  { key: 'step3', motif: 'neem' },
  { key: 'step4', motif: 'paddy' }
]

const COLOR = {
  kummayam900: '#360F19',
  arisi50: '#FDFBF5',
  pachai50: '#EFF6F0'
}

/**
 * The front door. Everything below /farmer and /dashboard is a working tool
 * built for speed and legibility on a basic phone; this one page is allowed
 * to spend some of that budget on atmosphere, because its only job is to
 * make a stranger understand what the tool does and want to try it.
 */
export default function Landing() {
  const { t } = useTranslation()

  return (
    <div data-page="landing" className="bg-arisi-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:px-4 focus:py-3 focus:bg-white focus:text-pachai-900 focus:rounded-lg focus:font-semibold"
      >
        {t('landing_scroll_hint')}
      </a>

      {/* ---- Hero ------------------------------------------------------ */}
      <section className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-kummayam-900 text-arisi-50">
        {/* Atmosphere: a dawn radial breaking low from the horizon, plus two
            drifting pulli layers for depth — dust settling, not confetti. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 60% at 50% 115%, rgba(224,163,23,0.22), transparent 60%),' +
              'radial-gradient(ellipse 70% 50% at 15% -10%, rgba(160,62,42,0.35), transparent 60%)'
          }}
        />
        <div className="hero-field absolute inset-0" />
        <div className="hero-field field-b absolute inset-0" />

        {/* Floating brand mark — quiet, not a full masthead. This page's job
            is to earn a click through to the real app, not to be it. */}
        <header className="relative z-10 max-w-6xl w-full mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-arisi-100">
            <Emblem size={30} className="text-manjal-300 shrink-0" />
            <span lang="ta" className="font-display font-bold text-lg leading-none">
              {t('app_name_ta')}
            </span>
          </Link>
          <LanguageSwitcher />
        </header>

        <div className="relative z-10 flex-1 flex items-center">
          <div className="max-w-6xl w-full mx-auto px-5 sm:px-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <p className="font-data text-xs sm:text-sm tracking-[0.2em] text-manjal-300 mb-6">
                {t('landing_kicker')}
              </p>

              <h1 className="font-display font-extrabold leading-[1.05]">
                <span lang="ta" className="block text-4xl sm:text-5xl xl:text-6xl">
                  {t('landing_hero_ta')}
                </span>
                <span lang="en" className="block text-xl sm:text-2xl xl:text-3xl font-semibold text-arisi-300 mt-3">
                  {t('landing_hero_en')}
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg text-arisi-200 leading-relaxed">
                {t('landing_hero_sub')}
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/farmer/capture" className="btn-primary text-base">
                  {t('landing_cta_primary')}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link to="/dashboard/map" className="btn-secondary text-base">
                  {t('landing_cta_secondary')}
                </Link>
              </div>
            </div>

            {/* The signature: the kolam drawing itself. This exact component
                is also what the farmer sees while the model looks at their
                photo — here it introduces the idea, there it pays it off. */}
            <div className="hidden lg:flex items-center justify-center">
              <Kolam
                size={340}
                stroke="#E0A317"
                strokeWidth={3.5}
                className="opacity-90"
                title={t('landing_hero_en')}
              />
            </div>
          </div>
        </div>

        <p className="relative z-10 text-center text-xs tracking-[0.2em] text-arisi-300/70 pb-6 font-data uppercase">
          {t('landing_scroll_hint')} ↓
        </p>
      </section>

      <Seam from={COLOR.kummayam900} to={COLOR.arisi50} />

      {/* ---- Story: the four-step pipeline ------------------------------ */}
      <section id="main" className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 lg:py-28">
        <div className="relative">
          {/* The thread — one line, unbroken, run down the spine of the four
              steps, exactly as a kolam loop is drawn around its dots without
              lifting the hand. This is what makes the scroll itself part of
              the story rather than just a container for it. */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute left-6 top-3 bottom-3 w-px thread-line"
          />

          <div className="space-y-20 lg:space-y-28">
            {STEPS.map((step, index) => {
              const reverse = index % 2 === 1
              return (
                <Reveal as="article" key={step.key} className="relative lg:pl-20">
                  <span
                    aria-hidden="true"
                    className="thread-dot hidden lg:block absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 -translate-x-1/2"
                  />

                  <div
                    className={`grid md:grid-cols-[1fr_1fr] gap-8 md:gap-14 items-center ${
                      reverse ? 'md:[direction:rtl]' : ''
                    }`}
                  >
                    <div style={reverse ? { direction: 'ltr' } : undefined}>
                      <p className="eyebrow">{t(`landing_${step.key}_eyebrow`)}</p>
                      <h2 className="text-2xl sm:text-3xl font-display font-bold text-mai-900 mt-3 mb-4">
                        {t(`landing_${step.key}_title`)}
                      </h2>
                      <p className="text-mai-700 leading-relaxed max-w-md">
                        {t(`landing_${step.key}_body`)}
                      </p>
                    </div>

                    <div
                      className="flex items-center justify-center"
                      style={reverse ? { direction: 'ltr' } : undefined}
                    >
                      <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-pachai-50 border border-pachai-100 flex items-center justify-center">
                        {step.motif ? (
                          <PlantMotif
                            name={step.motif}
                            size={92}
                            strokeWidth={1.8}
                            className="text-pachai-700"
                          />
                        ) : (
                          <Kolam size={112} stroke="#2E6B41" strokeWidth={4} loop />
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <Seam from={COLOR.arisi50} to={COLOR.pachai50} />

      {/* ---- Trust strip: typographic facts, not KPI cards -------------- */}
      <section className="bg-pachai-50 py-16 lg:py-20">
        <Reveal className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center sm:items-stretch justify-center gap-10 sm:gap-0 text-center">
          <div className="sm:px-10">
            <p className="font-display font-extrabold text-4xl xl:text-5xl text-pachai-800 tabular">
              ₹<CountUp value={0} />
            </p>
            <p className="text-mai-600 text-sm mt-2">{t('landing_stat1_label')}</p>
          </div>
          <div aria-hidden="true" className="hidden sm:block w-px bg-pachai-300/60" />
          <div className="sm:px-10">
            <p className="font-display font-extrabold text-4xl xl:text-5xl text-pachai-800 tabular">
              <CountUp value={2} />+
            </p>
            <p className="text-mai-600 text-sm mt-2">{t('landing_stat2_label')}</p>
          </div>
          <div aria-hidden="true" className="hidden sm:block w-px bg-pachai-300/60" />
          <div className="sm:px-10">
            <p className="font-display font-extrabold text-2xl xl:text-3xl text-pachai-800">
              {t('landing_stat3_value')}
            </p>
            <p className="text-mai-600 text-sm mt-2">{t('landing_stat3_label')}</p>
          </div>
        </Reveal>
      </section>

      <Seam from={COLOR.pachai50} to={COLOR.kummayam900} flip />

      {/* ---- Closing: mirrors the hero, the bookend ---------------------- */}
      <section className="relative bg-kummayam-900 text-arisi-50 py-24 lg:py-32 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(224,163,23,0.16), transparent 60%)'
          }}
        />
        <Reveal
          as="div"
          className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center"
        >
          <h2 lang="ta" className="font-display font-extrabold text-3xl sm:text-4xl xl:text-5xl leading-tight">
            {t('landing_closing_ta')}
          </h2>
          <p className="mt-5 text-arisi-200 text-lg leading-relaxed max-w-xl mx-auto">
            {t('landing_closing_body')}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/farmer/capture" className="btn-primary text-base">
              {t('landing_closing_cta_primary')}
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/dashboard" className="btn-secondary text-base">
              {t('landing_closing_cta_secondary')}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ---- Footer ------------------------------------------------------ */}
      <footer className="bg-arisi-50 border-t border-arisi-300">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-mai-800">
            <Emblem size={24} className="text-pachai-700 shrink-0" />
            <span lang="ta" className="font-display font-semibold">
              {t('app_name_ta')}
            </span>
          </div>
          <p className="text-sm text-mai-600 text-center sm:text-left max-w-md">
            {t('landing_footer_note')}
          </p>
          <nav aria-label="Landing" className="flex items-center gap-5 text-sm font-semibold">
            <Link to="/farmer" className="text-pachai-800 hover:underline">
              {t('nav_home')}
            </Link>
            <Link to="/dashboard" className="text-pachai-800 hover:underline">
              {t('nav_dashboard')}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
