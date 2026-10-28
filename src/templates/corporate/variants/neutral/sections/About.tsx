import type { CorporateConfig } from '../../../schema'
import { SafeImage } from '../../../components/SafeImage'

export function NeutralAbout({ config }: { config: CorporateConfig }) {
  const { about, business } = config
  if (!about.body && about.highlights.length === 0) return null

  return (
    <section id="about" className="bg-[var(--site-surface)] py-16 sm:py-20" aria-labelledby="about-heading">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 md:grid-cols-2">
        <SafeImage
          src={undefined}
          alt=""
          fallbackLabel={business.name.slice(0, 2).toUpperCase()}
          className="aspect-square w-full rounded-2xl object-cover md:order-2"
        />

        <div>
          {about.heading && (
            <h2 id="about-heading" className="text-3xl font-bold tracking-tight text-[var(--site-text)]">
              {about.heading}
            </h2>
          )}
          {about.body && (
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-[var(--site-text-muted)]">
              {about.body.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {about.highlights.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {about.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-full bg-[var(--site-bg)] px-4 py-1.5 text-sm font-medium text-[var(--site-text)]"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
