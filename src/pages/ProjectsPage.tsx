import { AlertTriangle, FolderKanban } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, fetchProjects, type Project } from '../auth/apiClient'
import { EmptyState } from '../components/ui/EmptyState'
import { LinkButton } from '../components/ui/LinkButton'
import { useRadioGroup } from '../hooks/useRadioGroup'
import { pageTitleClass } from '../styles/typography'

type LoadState = 'loading' | 'loaded' | 'error'
type StatusFilter = 'active' | 'archived'

const PAGE_SIZE = 10

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

export function ProjectsPage() {
  const [status, setStatus] = useState<StatusFilter>('active')
  const [offset, setOffset] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchProjects({ status, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (cancelled) return
        setProjects(result.projects)
        setTotal(result.total)
        setLoadState('loaded')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error(error instanceof ApiError ? error.message : error)
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [status, offset])

  function switchStatus(next: StatusFilter) {
    setStatus(next)
    setOffset(0)
    setLoadState('loading')
  }

  const statusGroup = useRadioGroup<StatusFilter>({ value: status, onChange: switchStatus, values: ['active', 'archived'] })

  function goToPage(nextOffset: number) {
    setOffset(nextOffset)
    setLoadState('loading')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={pageTitleClass}>Projects</h2>
          <p className="text-sm text-text-muted">Every client site you build lives here.</p>
        </div>
        <LinkButton variant="primary" to="/projects/new">
          New project
        </LinkButton>
      </div>

      <div {...statusGroup.groupProps} aria-label="Project status" className="flex gap-2">
        {(['active', 'archived'] as const).map((value) => (
          <button
            key={value}
            type="button"
            {...statusGroup.getItemProps(value)}
            onClick={() => switchStatus(value)}
            className={`rounded-md border px-3.5 py-2 text-sm font-medium capitalize transition-colors ${
              status === value
                ? 'border-accent bg-accent/10 text-accent-strong'
                : 'border-border-strong text-text-muted hover:text-text'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {loadState === 'loading' && (
        <p className="py-16 text-center text-sm text-text-muted">Loading projects…</p>
      )}

      {loadState === 'error' && (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load projects"
          description="Something went wrong talking to the server. Try refreshing the page."
        />
      )}

      {loadState === 'loaded' && projects.length === 0 && status === 'active' && (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first client site from the corporate template."
          action={
            <LinkButton variant="primary" to="/projects/new">
              New project
            </LinkButton>
          }
        />
      )}

      {loadState === 'loaded' && projects.length === 0 && status === 'archived' && (
        <EmptyState icon={FolderKanban} title="No archived projects" description="Archived projects will show up here." />
      )}

      {loadState === 'loaded' && projects.length > 0 && (
        <>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-bg"
                >
                  <div>
                    <p className="text-sm font-medium text-text">{project.name}</p>
                    <p className="text-sm text-text-muted">
                      {project.businessName ? `${project.businessName} — ` : ''}/{project.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-muted">Updated {formatDate(project.updatedAt)}</span>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-strong">
                      {project.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between text-sm text-text-muted">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => goToPage(Math.max(0, offset - PAGE_SIZE))}
                className="font-medium text-accent-strong hover:underline disabled:cursor-not-allowed disabled:text-text-faint disabled:no-underline"
              >
                Previous
              </button>
              <span>
                {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
              </span>
              <button
                type="button"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => goToPage(offset + PAGE_SIZE)}
                className="font-medium text-accent-strong hover:underline disabled:cursor-not-allowed disabled:text-text-faint disabled:no-underline"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
