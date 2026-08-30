import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './i18n'
import './index.css'
import { startAutoSync } from './offline/sync'

// A raw backslash (or other characters invalid in a URL path) reaching the
// browser bar — from a link mangled by a chat app's auto-linkifier, a stray
// paste, whatever — crashes react-router's own location parsing before a
// single component mounts, leaving a blank page with no way back in.
// Normalising here, before BrowserRouter ever reads the URL, means a bad
// link degrades to "opens the app" instead of "shows nothing".
if (/\\/.test(window.location.pathname)) {
  const cleaned = window.location.pathname.replace(/\\+/g, '/').replace(/\/{2,}/g, '/')
  window.history.replaceState(null, '', cleaned + window.location.search + window.location.hash)
}

// Watches for connectivity returning and drains the offline report queue.
startAutoSync()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
