import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProjects, type Project } from '../auth/apiClient'
import { HealthBadge } from '../components/ui/HealthBadge'
import { pageDescriptionClass, pageTitleClass } from '../styles/typography'

export function DashboardPage() {
  const [total, setTotal] = useState<number | null>(null)
  const [mostRecent, setMostRecent] = useState<Project | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchProjects({ status: 'active', limit: 1 })
      .then((result) => {
        if (cancelled) return
        setTotal(result.total)
        setMostRecent(result.projects[0] ?? null)
      })
      .catch(() => {
        if (!cancelled) setTotal(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className={pageTitleClass}>Website Factory</h2>
        <p className={pageDescriptionClass}>
          A private workspace for building client websites from reusable templates. Start a
          project, pick a template, and hand off a finished site — one operator running the
          whole line.
        </p>
        <HealthBadge />
      </div>

      <div className="border-t border-border pt-6">
        <p className="font-serif text-3xl font-medium leading-none text-text">
          {total === null ? '—' : total}
        </p>
        <p className="mt-2 text-sm font-medium text-text">
          {total === null ? 'Loading active projects…' : `active project${total === 1 ? '' : 's'}`}
        </p>
        <p className="text-sm text-text-muted">
          {mostRecent ? `Most recently updated: ${mostRecent.name}` : 'Nothing in production yet'}
        </p>
        <Link
          to="/projects"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
        >
          Go to projects
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-2 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-text">What's next</h3>
        <p className="max-w-xl text-sm leading-relaxed text-text-muted">
          Create a project from the Projects page, fill in its configuration, and track changes
          through its version history. The live visual editor and deployment pipeline are built
          on top of this foundation in later phases.
        </p>
      </div>
    </div>
  )
}
