import { useContext } from 'react'
import { NavLink, type NavLinkProps } from 'react-router-dom'
import { UnsavedChangesContext } from './unsaved-changes-context'

/**
 * A NavLink that asks before navigating away from unsaved work (see
 * UnsavedChangesProvider). Used for the sidebar/mobile nav, which otherwise has no way
 * to know a sibling page like the project editor has a dirty draft.
 */
export function GuardedNavLink(props: NavLinkProps) {
  const { dirty, message } = useContext(UnsavedChangesContext)

  return (
    <NavLink
      {...props}
      onClick={(event) => {
        if (dirty && !window.confirm(message)) {
          event.preventDefault()
          return
        }
        props.onClick?.(event)
      }}
    />
  )
}
