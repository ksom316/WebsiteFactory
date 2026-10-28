import { GuardedNavLink } from '../../navigation/GuardedNavLink'
import { BrandMark } from '../ui/BrandMark'
import { navItems } from './nav-items'

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 md:flex">
      <div className="px-1">
        <BrandMark />
      </div>
      <nav className="mt-8 flex flex-col gap-0.5" aria-label="Primary">
        {navItems.map(({ to, label, icon: Icon }) => (
          <GuardedNavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent-strong'
                  : 'text-text-muted hover:bg-border/60 hover:text-text'
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </GuardedNavLink>
        ))}
      </nav>
    </aside>
  )
}
