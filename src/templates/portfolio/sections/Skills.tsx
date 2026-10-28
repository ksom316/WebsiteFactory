import type { PortfolioConfig } from '../schema'
import { SafeLink } from '../components/SafeLink'

/**
 * Skill groups rendered as plain tag lists, and services as plain described cards —
 * deliberately no proficiency bars/percentages (there's no honest way to quantify
 * "80% React"), matching the brief's explicit guidance for this section.
 */
export function PortfolioSkills({ config }: { config: PortfolioConfig }) {
  const { skills } = config
  if (skills.groups.length === 0 && skills.services.length === 0) return null

  return (
    <section id="skills" className="bg-[var(--site-surface-raised)] py-20" aria-label="Skills and services">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          {skills.heading || 'Skills & services'}
        </h2>
        {skills.intro && <p className="mt-4 max-w-xl text-[var(--site-text-muted)]">{skills.intro}</p>}

        {skills.groups.length > 0 && (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {skills.groups.map((group) => (
              <div key={group.name}>
                <h3 className="font-[family-name:var(--site-font-display)] text-lg font-semibold">{group.name}</h3>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-2.5 py-1 text-xs text-[var(--site-text-muted)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {skills.services.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {skills.services.map((service) => (
              <div key={service.title} className="rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
                <h3 className="font-[family-name:var(--site-font-display)] text-lg font-semibold">{service.title}</h3>
                {service.description && <p className="mt-2 text-sm leading-relaxed text-[var(--site-text-muted)]">{service.description}</p>}
                {service.href && (
                  <SafeLink href={service.href} className="mt-3 inline-block text-sm font-medium text-[var(--site-accent-strong)] hover:underline">
                    Learn more
                  </SafeLink>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
