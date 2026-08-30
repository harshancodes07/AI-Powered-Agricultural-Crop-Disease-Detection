import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './i18n'
import './index.css'
import { startAutoSync } from './offline/sync'

// A backslash reaching the browser bar — from a link mangled by whatever
// it was shared through — crashes react-router's own location parsing
// before a single component mounts. The first fix here only checked for a
// literal backslash character, but browsers do NOT decode a %5C escape in
// location.pathname on their own: window.location.pathname for .../%5C is
// the literal four characters "/%5C", not an actual backslash byte. Match
// both the raw and percent-encoded forms (either case), so a bad link
// degrades to "opens the app" instead of "shows an error screen".
if (/\\|%5c/i.test(window.location.pathname)) {
  const cleaned = window.location.pathname
    .replace(/\\|%5c/gi, '/')
    .replace(/\/{2,}/g, '/')
  window.history.replaceState(null, '', (cleaned || '/') + window.location.search + window.location.hash)
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
