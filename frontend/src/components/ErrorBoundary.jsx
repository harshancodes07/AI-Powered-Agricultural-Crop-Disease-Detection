import { Component } from 'react'

/**
 * The last line of defence against a blank screen.
 *
 * Without this, any render-time crash — a malformed URL, a bad response
 * shape, anything React Router or a page throws while mounting — leaves the
 * visitor looking at pure white with no way back in. That's what happened
 * with a stray trailing backslash in a shared link: react-router's own
 * location parsing threw before a single component painted.
 *
 * This catches it and always leaves a way home, in both languages, without
 * depending on i18n or routing (either of which might be what crashed).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          background: '#FDFBF5',
          color: '#2A1D18',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          ஏதோ தவறு நடந்தது · Something went wrong
        </p>
        <p style={{ color: '#4A3830', maxWidth: '28rem' }}>
          This page couldn't load. Going home usually fixes it.
        </p>
        <a
          href="/"
          style={{
            minHeight: '3rem',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 1.5rem',
            borderRadius: '0.5rem',
            background: '#2E6B41',
            color: '#FDFBF5',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          முகப்புக்குச் செல்ல · Go home
        </a>
      </div>
    )
  }
}
