import type { PortfolioConfig } from '../schema'

/**
 * A configurable timeline/process list — equally useful as a career history for an
 * experienced consultant or a "how I work" process outline for an early-career
 * professional, since every field beyond `title` is optional (see schema.ts).
 */
export function PortfolioExperience({ config }: { config: PortfolioConfig }) {
  const { experience } = config
  if (experience.entries.length === 0) return null

  return (
    <section id="experience" className="mx-auto max-w-4xl px-6 py-20" aria-label="Experience">
      <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
        {experience.heading || 'Experience'}
      </h2>
      {experience.intro && <p className="mt-4 max-w-xl text-[var(--site-text-muted)]">{experience.intro}</p>}

      <ol className="mt-10 space-y-8 border-l border-[var(--site-border)] pl-6">
        {experience.entries.map((entry, index) => (
          <li key={`${entry.title}-${index}`} className="relative">
            <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--site-accent)]" aria-hidden="true" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-[family-name:var(--site-font-display)] text-lg font-semibold">{entry.title}</h3>
              {entry.period && <span className="text-sm text-[var(--site-text-faint)]">{entry.period}</span>}
            </div>
            {entry.organization && <p className="text-sm text-[var(--site-text-muted)]">{entry.organization}</p>}
            {entry.description && <p className="mt-2 text-sm leading-relaxed text-[var(--site-text-muted)]">{entry.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}
