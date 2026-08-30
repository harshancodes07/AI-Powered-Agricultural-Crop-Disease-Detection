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

// The auto-injected service-worker registration script only calls
// navigator.serviceWorker.register() once — it never checks for updates or
// reloads the page when a newer version takes over. Combined with skipWaiting
// + clientsClaim on the worker side (see vite.config.js), a new deploy DOES
// activate and start controlling the page automatically, but without this
// listener nothing ever tells an already-open tab to actually reload and run
// the new code — it silently keeps executing whatever was in memory when the
// tab was opened, indefinitely, regardless of how many times the person hits
// refresh. `controllerchange` fires exactly when that handover happens, so
// reload once, right then, and they see the update without doing anything.
if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return // a browser can fire this more than once
    reloading = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
