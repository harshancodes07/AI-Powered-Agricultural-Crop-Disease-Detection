import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import DashboardFilters, { EMPTY_FILTERS } from '../components/DashboardFilters'
import { getMapPoints } from '../services/api'
import { confidencePercent, cropLabel, diseaseLabel, formatDate } from '../utils/format'

// Fallback view: roughly central Tamil Nadu, used when there is nothing to plot.
const DEFAULT_CENTER = [11.1271, 78.6569]
const DEFAULT_ZOOM = 7

/**
 * Markers carry a letter as well as a colour, so the map is still readable
 * without colour vision.
 */
function markerIcon(disease) {
  const healthy = disease === 'healthy'
  const colour = healthy ? '#15803d' : '#b45309'
  const letter = healthy ? '✓' : '!'
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;
             width:26px;height:26px;border-radius:50%;background:${colour};
             color:#fff;font-weight:700;border:2px solid #fff;
             box-shadow:0 1px 4px rgba(0,0,0,.4)">${letter}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  })
}

export default function DashboardMap() {
  const { t, i18n } = useTranslation()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [points, setPoints] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    getMapPoints(filters)
      .then((data) => {
        setPoints(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [filters])

  const center = points.length > 0 ? [points[0].latitude, points[0].longitude] : DEFAULT_CENTER

  return (
    <div className="space-y-6">
      <DashboardFilters filters={filters} onChange={setFilters} />

      <section className="card p-5">
        <h2 className="text-xl font-bold mb-1">{t('dash_map_title')}</h2>
        <p className="text-slate-600 text-sm mb-4">{t('dash_subtitle')}</p>

        {error && (
          <p role="alert" className="mb-4 text-red-900 font-semibold">{error}</p>
        )}

        {points.length === 0 && !error && (
          <p role="status" className="mb-4 text-slate-700">{t('dash_map_empty')}</p>
        )}

        <div className="h-[65vh] min-h-[24rem] rounded-xl overflow-hidden border-2 border-slate-200">
          <MapContainer
            center={center}
            zoom={points.length > 0 ? 9 : DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom
          >
            {/* OpenStreetMap: free, no API key, no billing account. */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MarkerClusterGroup chunkedLoading>
              {points.map((point) => (
                <Marker
                  key={point.id}
                  position={[point.latitude, point.longitude]}
                  icon={markerIcon(point.disease)}
                >
                  <Popup>
                    <p className="font-bold">{diseaseLabel(t, point.disease)}</p>
                    <p>{cropLabel(t, point.crop)}</p>
                    <p>
                      {t('result_confidence')}: {confidencePercent(point.confidence)}
                    </p>
                    {point.region && <p>{point.region}</p>}
                    <p className="text-slate-600">
                      {formatDate(point.created_at, i18n.language)}
                    </p>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        <p className="text-sm text-slate-600 mt-3">{t('dash_source_note')}</p>
      </section>
    </div>
  )
}
