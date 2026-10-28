import type { CorporateConfig } from '../../../schema'

export function NeutralServices({ config }: { config: CorporateConfig }) {
  const { services } = config
  if (services.length === 0) return null

  return (
    <section id="services" className="bg-[var(--site-bg)] py-16 sm:py-20" aria-labelledby="services-heading">
      <div className="mx-auto max-w-5xl px-6">
        <h2 id="services-heading" className="text-center text-3xl font-bold tracking-tight text-[var(--site-text)]">
          What we offer
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {services.map((service) => (
            <div key={service.title} className="rounded-2xl bg-[var(--site-surface)] p-6">
              <h3 className="text-lg font-semibold text-[var(--site-text)]">{service.title}</h3>
              {service.description && (
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--site-text-muted)]">
                  {service.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
