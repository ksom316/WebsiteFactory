import { createContext } from 'react'

export interface UnsavedChangesContextValue {
  dirty: boolean
  message: string
  setDirty: (dirty: boolean, message?: string) => void
}

export const DEFAULT_UNSAVED_CHANGES_MESSAGE = 'You have unsaved changes. Leave this page without saving?'

export const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  dirty: false,
  message: DEFAULT_UNSAVED_CHANGES_MESSAGE,
  setDirty: () => {},
})
