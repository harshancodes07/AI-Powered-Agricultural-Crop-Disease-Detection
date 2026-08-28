import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Live camera capture using getUserMedia.
 *
 * Why this exists: on a phone, <input capture="environment"> opens the camera
 * app directly. On a laptop that attribute is ignored — the browser just shows
 * a file picker, so there is no way to use the built-in webcam. This component
 * gives the laptop a real viewfinder and a shutter button.
 *
 * getUserMedia needs a secure context. http://localhost counts as secure, but
 * a plain-http LAN address (e.g. http://192.168.x.x:5173 on a phone) does not —
 * there the API is simply missing and the caller falls back to the file input.
 */
export default function CameraCapture({ onCapture, onClose }) {
  const { t } = useTranslation()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const dialogRef = useRef(null)

  // starting | ready | denied | unavailable | insecure | error
  const [state, setState] = useState('starting')
  const [facingMode, setFacingMode] = useState('environment')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    let cancelled = false

    async function start() {
      setState('starting')

      if (!navigator.mediaDevices?.getUserMedia) {
        // Almost always an insecure origin rather than a missing camera.
        setState(window.isSecureContext === false ? 'insecure' : 'unavailable')
        return
      }

      let stream
      try {
        try {
          // A hint, not a hard constraint: a laptop with one webcam still works.
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false
          })
        } catch (err) {
          if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          } else {
            throw err
          }
        }
      } catch (err) {
        if (cancelled) return
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') setState('denied')
        else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') setState('unavailable')
        else setState('error')
        return
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Autoplay can still be rejected; the stream is live either way.
        videoRef.current.play().catch(() => {})
      }
      setState('ready')

      // Only offer a front/back switch when there is something to switch to.
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (!cancelled) {
          setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1)
        }
      } catch {
        /* device labels are not essential */
      }
    }

    start()
    return () => {
      cancelled = true
      stopStream()
    }
  }, [facingMode, stopStream])

  // Escape closes, and focus starts inside the dialog.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function takePhoto() {
    const video = videoRef.current
    // videoWidth is 0 until the first frame has actually arrived.
    if (!video || !video.videoWidth) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `crop-${Date.now()}.jpg`, { type: 'image/jpeg' })
        stopStream()
        onCapture(file)
      },
      'image/jpeg',
      0.9
    )
  }

  const failed = ['denied', 'unavailable', 'insecure', 'error'].includes(state)
  const messageKey = {
    denied: 'camera_denied',
    unavailable: 'camera_unavailable',
    insecure: 'camera_insecure',
    error: 'camera_error'
  }[state]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('camera_title')}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-xl bg-white rounded-2xl overflow-hidden flex flex-col max-h-full"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-bold">{t('camera_title')}</h2>
          <button type="button" onClick={onClose} className="btn-quiet min-h-[2.75rem]">
            {t('camera_cancel')}
          </button>
        </div>

        <div className="bg-slate-900 relative flex-1 min-h-0">
          {/* Mirrored only for the selfie camera, so it feels like a mirror. */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            aria-label={t('camera_live')}
            className={`w-full max-h-[60vh] object-contain ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />

          {state === 'starting' && (
            <p role="status" className="absolute inset-0 grid place-items-center text-white font-semibold">
              {t('camera_starting')}
            </p>
          )}

          {failed && (
            <p role="alert" className="absolute inset-0 grid place-items-center text-center text-white font-semibold p-6">
              {t(messageKey)}
            </p>
          )}
        </div>

        <div className="p-4 flex flex-wrap gap-3">
          {state === 'ready' ? (
            <>
              <button type="button" onClick={takePhoto} className="btn-primary flex-1 text-lg">
                <span aria-hidden="true">📸</span>
                {t('camera_take')}
              </button>
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
                  className="btn-secondary"
                >
                  {t('camera_switch')}
                </button>
              )}
            </>
          ) : (
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('camera_use_file')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Whether a live viewfinder is possible here at all. */
export function cameraSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia)
}
