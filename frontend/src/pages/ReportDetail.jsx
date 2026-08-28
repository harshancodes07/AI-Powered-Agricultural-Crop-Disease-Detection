import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Result from './Result'
import { getReport } from '../services/api'

/**
 * Loads a stored report from the server and reuses the Result screen to show
 * it, so a past report looks exactly like a fresh one.
 */
export default function ReportDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getReport(id)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <p role="alert" className="card border-red-300 bg-red-50 p-4 text-red-900 font-semibold">
        {error}
      </p>
    )
  }
  if (!detail) {
    return (
      <p role="status" className="card p-6 text-center">
        {t('loading')}
      </p>
    )
  }

  return <Result detail={detail} />
}
