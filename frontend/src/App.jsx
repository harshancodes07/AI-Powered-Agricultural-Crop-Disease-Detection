import { Navigate, Route, Routes } from 'react-router-dom'

import DashboardLayout from './layouts/DashboardLayout'
import FarmerLayout from './layouts/FarmerLayout'
import Capture from './pages/Capture'
import DashboardAnalytics from './pages/DashboardAnalytics'
import DashboardHome from './pages/DashboardHome'
import DashboardMap from './pages/DashboardMap'
import DashboardReports from './pages/DashboardReports'
import History from './pages/History'
import Home from './pages/Home'
import ReportDetail from './pages/ReportDetail'
import Result from './pages/Result'

/**
 * Two separate applications sharing one build:
 *   /farmer/*    — the mobile-first farmer PWA
 *   /dashboard/* — the government monitoring dashboard
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/farmer" replace />} />

      <Route path="/farmer" element={<FarmerLayout />}>
        <Route index element={<Home />} />
        <Route path="capture" element={<Capture />} />
        <Route path="result" element={<Result />} />
        <Route path="history" element={<History />} />
        <Route path="report/:id" element={<ReportDetail />} />
      </Route>

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="map" element={<DashboardMap />} />
        <Route path="reports" element={<DashboardReports />} />
        <Route path="analytics" element={<DashboardAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/farmer" replace />} />
    </Routes>
  )
}
