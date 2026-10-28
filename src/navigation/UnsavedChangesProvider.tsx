import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_UNSAVED_CHANGES_MESSAGE,
  UnsavedChangesContext,
  type UnsavedChangesContextValue,
} from './unsaved-changes-context'

/**
 * App-wide "is there unsaved work right now" flag, used to:
 *  1. Show the browser's native confirmation on tab close/reload (`beforeunload`).
 *  2. Let in-app navigation (sidebar links, "back" links) ask before leaving — see
 *     GuardedLink/GuardedNavLink. This exists because the app uses a plain
 *     `<BrowserRouter>`, not a data router, so react-router's own navigation-blocking
 *     APIs (`useBlocker`) aren't available; this is the best equivalent without
 *     migrating the whole app's router setup for one feature.
 */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirtyState] = useState(false)
  const [message, setMessage] = useState(DEFAULT_UNSAVED_CHANGES_MESSAGE)

  const setDirty = useCallback<UnsavedChangesContextValue['setDirty']>((next, nextMessage) => {
    setDirtyState(next)
    if (nextMessage) setMessage(nextMessage)
  }, [])

  useEffect(() => {
    if (!dirty) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  const value = useMemo(() => ({ dirty, message, setDirty }), [dirty, message, setDirty])

  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>
}
