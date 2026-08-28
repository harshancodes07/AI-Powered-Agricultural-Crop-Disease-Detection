import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { NetworkError, createReport } from '../services/api'
import { enqueue } from '../offline/queue'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

const CROPS = ['tomato', 'potato', 'corn', 'rice']

export default function Capture() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const online = useOnlineStatus()

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [crop, setCrop] = useState('')
  const [location, setLocation] = useState(null)
  const [locationState, setLocationState] = useState('idle') // idle|locating|granted|denied|unsupported
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const errorRef = useRef(null)

  // Release the object URL so repeated captures don't leak memory.
  useEffect(() => {
    if (!file) return undefined
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Move focus to the error so it is announced and cannot be missed.
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationState('unsupported')
      return
    }
    setLocationState('locating')
    // Only ever called from an explicit button press — we never grab location
    // silently (CLAUDE.md section 18).
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        setLocationState('granted')
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!file) {
      setError(t('capture_need_photo'))
      return
    }
    if (!crop) {
      setError(t('capture_need_crop'))
      return
    }

    setSubmitting(true)
    const payload = {
      file,
      cropType: crop,
      language: i18n.language,
      latitude: location?.latitude,
      longitude: location?.longitude
    }

    // Offline: queue it and tell the farmer plainly what happened.
    if (!online) {
      await enqueue(payload)
      setSubmitting(false)
      navigate('/farmer/history', { state: { justQueued: true } })
      return
    }

    try {
      const detail = await createReport(payload)
      navigate('/farmer/result', { state: { detail } })
    } catch (err) {
      if (err instanceof NetworkError) {
        // The connection dropped mid-request. Never lose the report.
        await enqueue(payload)
        navigate('/farmer/history', { state: { justQueued: true } })
        return
      }
      setError(err.message || t('error_generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <h1 className="text-2xl font-bold">{t('capture_title')}</h1>

      {error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="card border-red-300 bg-red-50 text-red-900 p-4 font-semibold"
        >
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}

      {/* Step 1: photo */}
      <section className="card p-5">
        <h2 className="field-label text-lg">{t('capture_step_photo')}</h2>

        {previewUrl && (
          <img
            src={previewUrl}
            alt={t('capture_photo_selected')}
            className="w-full max-h-64 object-contain rounded-xl border-2 border-slate-200 mb-4 bg-slate-50"
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {/* `capture` opens the rear camera directly on a phone. */}
          <label className="btn-primary cursor-pointer">
            <span aria-hidden="true">📷</span>
            {previewUrl ? t('capture_change_photo') : t('capture_take_photo')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <label className="btn-secondary cursor-pointer">
            {t('capture_choose_file')}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </section>

      {/* Step 2: crop */}
      <section className="card p-5">
        <fieldset>
          <legend className="field-label text-lg">{t('capture_step_crop')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {CROPS.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 min-h-[3.25rem] px-4 rounded-xl border-2 cursor-pointer font-semibold ${
                  crop === option
                    ? 'border-brand-700 bg-brand-50 text-brand-900'
                    : 'border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="crop"
                  value={option}
                  checked={crop === option}
                  onChange={() => setCrop(option)}
                  className="w-5 h-5 accent-brand-700"
                />
                {t(`crop_${option}`)}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Step 3: location, always optional */}
      <section className="card p-5">
        <h2 className="field-label text-lg">{t('capture_step_location')}</h2>
        <p className="text-slate-700 mb-4">{t('capture_location_help')}</p>

        <button
          type="button"
          onClick={requestLocation}
          disabled={locationState === 'locating'}
          className="btn-secondary w-full"
        >
          <span aria-hidden="true">📍</span>
          {locationState === 'locating' ? t('capture_locating') : t('capture_share_location')}
        </button>

        <p role="status" aria-live="polite" className="mt-3 font-semibold">
          {locationState === 'granted' && (
            <span className="text-brand-800">
              <span aria-hidden="true">✓ </span>
              {t('capture_location_shared')}
            </span>
          )}
          {locationState === 'denied' && (
            <span className="text-amber-900">
              <span aria-hidden="true">! </span>
              {t('capture_location_denied')}
            </span>
          )}
          {locationState === 'unsupported' && (
            <span className="text-amber-900">{t('capture_location_unavailable')}</span>
          )}
        </p>
      </section>

      <button type="submit" disabled={submitting} className="btn-primary w-full text-lg">
        {submitting
          ? t('capture_submitting')
          : online
            ? t('capture_submit')
            : t('capture_submit_offline')}
      </button>

      {!online && (
        <p className="text-slate-700 text-center">{t('capture_saved_offline')}</p>
      )}
    </form>
  )
}
