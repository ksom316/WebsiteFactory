import type { RealEstateConfig } from '../schema'
import { SafeImage } from '../components/SafeImage'
import { SafeLink } from '../components/SafeLink'

export function RealEstateAgents({ config }: { config: RealEstateConfig }) {
  const { agents } = config
  if (agents.team.length === 0) return null

  return (
    <section id="agents" className="mx-auto max-w-6xl px-6 py-20" aria-label="Our team">
      <h2 className="mb-10 text-center font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
        {agents.heading || 'Our team'}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {agents.team.map((agent) => (
          <div key={agent.name} className="flex flex-col items-center gap-3 rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)] p-6 text-center">
            <SafeImage
              src={agent.photoUrl}
              alt={agent.name}
              fallbackLabel={agent.name}
              className="h-24 w-24 rounded-full object-cover"
            />
            <div>
              <p className="font-[family-name:var(--site-font-display)] text-lg font-semibold">{agent.name}</p>
              {agent.title && <p className="text-sm text-[var(--site-text-muted)]">{agent.title}</p>}
            </div>
            <div className="flex flex-col gap-0.5 text-sm text-[var(--site-text-muted)]">
              {agent.email && (
                <SafeLink href={`mailto:${agent.email}`} className="hover:text-[var(--site-text)]">
                  {agent.email}
                </SafeLink>
              )}
              {agent.phone && (
                <SafeLink href={`tel:${agent.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-[var(--site-text)]">
                  {agent.phone}
                </SafeLink>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
