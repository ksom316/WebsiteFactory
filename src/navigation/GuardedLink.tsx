import { useContext } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { UnsavedChangesContext } from './unsaved-changes-context'

/** A Link that asks before navigating away from unsaved work. See GuardedNavLink. */
export function GuardedLink(props: LinkProps) {
  const { dirty, message } = useContext(UnsavedChangesContext)

  return (
    <Link
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
