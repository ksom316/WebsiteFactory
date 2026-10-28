import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BrandMark } from '../ui/BrandMark'
import { LogoutButton } from './LogoutButton'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { ThemeQuickToggle } from './ThemeQuickToggle'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/templates': 'Templates',
  '/settings': 'Settings',
}

// The template showcase embeds a preview iframe that needs more room than the
// dashboard's usual reading-width column.
const wideLayoutPaths = new Set(['/templates'])

function resolveTitle(pathname: string): string {
  if (pathname in pageTitles) return pageTitles[pathname]
  if (pathname === '/projects/new') return 'New project'
  if (pathname.startsWith('/projects/')) return 'Project'
  return 'Website Factory'
}

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { pathname } = useLocation()
  const title = resolveTitle(pathname)
  const contentWidthClass = wideLayoutPaths.has(pathname) ? 'max-w-6xl' : 'max-w-4xl'

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:text-text md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <div className="md:hidden">
              <BrandMark collapsed />
            </div>
            <h1 className="hidden text-[15px] font-semibold text-text md:block">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeQuickToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
          <div className={`mx-auto w-full ${contentWidthClass}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
