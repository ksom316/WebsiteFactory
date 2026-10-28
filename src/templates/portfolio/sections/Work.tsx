import { useMemo, useState } from 'react'
import type { PortfolioConfig, PortfolioProject } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { SafeLink } from '../components/SafeLink'

function ProjectCard({ project, fallbackLabel }: { project: PortfolioProject; fallbackLabel: string }) {
  const facts = [project.client, project.role].filter(Boolean).join(' · ')

  const body = (
    <>
      <SafeImage
        src={project.imageUrl}
        alt={project.title}
        fallbackLabel={fallbackLabel}
        className="aspect-[4/3] w-full rounded-lg object-cover"
      />
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-[family-name:var(--site-font-display)] text-lg font-semibold">{project.title}</h3>
          {project.date && <span className="shrink-0 text-xs text-[var(--site-text-faint)]">{project.date}</span>}
        </div>
        {project.category && (
          <p className="text-xs uppercase tracking-wide text-[var(--site-text-faint)]">{project.category}</p>
        )}
        {project.description && <p className="text-sm leading-relaxed text-[var(--site-text-muted)]">{project.description}</p>}
        {facts && <p className="text-xs text-[var(--site-text-faint)]">{facts}</p>}
        {project.tools.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {project.tools.map((tool) => (
              <li key={tool} className="rounded-full border border-[var(--site-border)] px-2 py-0.5 text-xs text-[var(--site-text-muted)]">
                {tool}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )

  // Only the card's own validated href makes it a link at all — a project with no
  // href renders the same content as a plain, non-interactive article instead of a
  // link to nowhere (see README.md's portfolio family section).
  if (project.href) {
    return (
      <SafeLink href={project.href} className="group block">
        {body}
      </SafeLink>
    )
  }

  return <article>{body}</article>
}

/**
 * Selected work with a client-side category filter — a plain array filter over the
 * already-configured `projects`, no backend search, mirroring the real-estate
 * family's listings filter (src/templates/real-estate/sections/Listings.tsx).
 */
export function PortfolioWork({ config }: { config: PortfolioConfig }) {
  const { work, person } = config
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')

  const categories = useMemo(
    () => Array.from(new Set(work.projects.map((p) => p.category).filter((c): c is string => Boolean(c)))),
    [work.projects],
  )

  if (work.projects.length === 0) {
    return (
      <section id="work" className="mx-auto max-w-5xl px-6 py-20" aria-label="Selected work">
        <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          {work.heading || 'Selected work'}
        </h2>
        <p className="mt-4 text-sm text-[var(--site-text-muted)]">
          Work is on its way — check back soon, or get in touch to see examples directly.
        </p>
      </section>
    )
  }

  const filtered = categoryFilter === 'all' ? work.projects : work.projects.filter((p) => p.category === categoryFilter)

  return (
    <section id="work" className="mx-auto max-w-5xl px-6 py-20" aria-label="Selected work">
      <div className="mb-10">
        <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          {work.heading || 'Selected work'}
        </h2>
        {work.intro && <p className="mt-4 max-w-xl text-[var(--site-text-muted)]">{work.intro}</p>}
      </div>

      {categories.length > 1 && (
        <div role="group" aria-label="Filter by category" className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${categoryFilter === 'all' ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={categoryFilter === category}
              onClick={() => setCategoryFilter(category)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${categoryFilter === category ? 'border-[var(--site-accent)] bg-[var(--site-accent)]/10 text-[var(--site-accent-strong)]' : 'border-[var(--site-border)] text-[var(--site-text-muted)]'}`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <ProjectCard key={`${project.title}-${index}`} project={project} fallbackLabel={person.name} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--site-text-muted)]">No projects in this category yet.</p>
      )}
    </section>
  )
}
