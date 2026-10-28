import type { CorporateConfig } from '../../../schema'

export function PremiumAbout({ config }: { config: CorporateConfig }) {
  const { about } = config
  if (!about.body && about.highlights.length === 0) return null

  return (
    <section id="about" className="border-b border-[var(--site-border)]" aria-labelledby="about-heading">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          {about.heading && (
            <h2
              id="about-heading"
              className="font-[family-name:var(--site-font-display)] text-3xl font-medium tracking-tight"
            >
              {about.heading}
            </h2>
          )}
          {about.body && (
            <div className="mt-5 max-w-xl space-y-4 text-[15px] leading-relaxed text-[var(--site-text-muted)]">
              {about.body.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>

        {about.highlights.length > 0 && (
          <div className="lg:col-span-5 lg:flex lg:items-start lg:justify-end">
            <ul className="w-full max-w-xs divide-y divide-[var(--site-border)] border-t border-[var(--site-border)]">
              {about.highlights.map((highlight) => (
                <li key={highlight} className="py-3.5 text-sm text-[var(--site-text-muted)]">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
