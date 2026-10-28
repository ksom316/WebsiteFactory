import type { CorporateConfig } from '../../../schema'

export function PremiumServices({ config }: { config: CorporateConfig }) {
  const { services } = config
  if (services.length === 0) return null

  return (
    <section id="services" className="border-b border-[var(--site-border)]" aria-labelledby="services-heading">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2
          id="services-heading"
          className="font-[family-name:var(--site-font-display)] text-3xl font-medium tracking-tight"
        >
          What we build
        </h2>

        <ul className="mt-10 divide-y divide-[var(--site-border)] border-t border-[var(--site-border)]">
          {services.map((service) => (
            <li key={service.title} className="grid gap-3 py-6 sm:grid-cols-12 sm:gap-6">
              <h3 className="sm:col-span-4">
                <span className="font-[family-name:var(--site-font-display)] text-lg">{service.title}</span>
              </h3>
              {service.description && (
                <p className="text-[15px] leading-relaxed text-[var(--site-text-muted)] sm:col-span-8">
                  {service.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
