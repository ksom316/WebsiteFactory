import { X } from 'lucide-react'
import { GuardedNavLink } from '../../navigation/GuardedNavLink'
import { BrandMark } from '../ui/BrandMark'
import { navItems } from './nav-items'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface px-4 py-5 shadow-xl">
        <div className="flex items-center justify-between">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:text-text"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <nav className="mt-8 flex flex-col gap-0.5" aria-label="Primary">
          {navItems.map(({ to, label, icon: Icon }) => (
            <GuardedNavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent/10 text-accent-strong' : 'text-text-muted hover:bg-border/60 hover:text-text'
                }`
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </GuardedNavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
