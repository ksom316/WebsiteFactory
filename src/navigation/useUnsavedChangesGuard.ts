import { useContext, useEffect } from 'react'
import { UnsavedChangesContext } from './unsaved-changes-context'

/** A page calls this with its own dirty flag; it's cleared automatically on unmount. */
export function useUnsavedChangesGuard(dirty: boolean, message?: string): void {
  const { setDirty } = useContext(UnsavedChangesContext)

  useEffect(() => {
    setDirty(dirty, message)
  }, [dirty, message, setDirty])

  useEffect(() => {
    return () => setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run the cleanup on unmount
  }, [])
}

export { UnsavedChangesContext }
