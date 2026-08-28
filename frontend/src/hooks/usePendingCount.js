import { useCallback, useEffect, useState } from 'react'

import { pendingCount } from '../offline/queue'
import { onSyncChange } from '../offline/sync'

/** How many reports are still waiting to reach the server. */
export function usePendingCount() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    pendingCount().then(setCount).catch(() => setCount(0))
  }, [])

  useEffect(() => {
    refresh()
    // Re-count whenever a sync run changes anything.
    const unsubscribe = onSyncChange(refresh)
    window.addEventListener('online', refresh)
    return () => {
      unsubscribe()
      window.removeEventListener('online', refresh)
    }
  }, [refresh])

  return [count, refresh]
}
