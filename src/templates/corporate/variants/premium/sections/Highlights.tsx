import type { CorporateConfig } from '../../../schema'
import { SafeImage } from '../../../components/SafeImage'
import { SafeLink } from '../../../components/SafeLink'

export function PremiumHighlights({ config }: { config: CorporateConfig }) {
  const { highlights } = config
  if (highlights.length === 0) return null

  return (
    <section id="highlights" className="border-b border-[var(--site-border)]" aria-labelledby="highlights-heading">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2
          id="highlights-heading"
          className="font-[family-name:var(--site-font-display)] text-3xl font-medium tracking-tight"
        >
          Selected work
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden border border-[var(--site-border)] sm:grid-cols-2">
          {highlights.map((item) => {
            const content = (
              <>
                <SafeImage
                  src={item.imageUrl}
                  alt=""
                  fallbackLabel={item.title.slice(0, 2).toUpperCase()}
                  className="h-40 w-full object-cover"
                />
                <div className="bg-[var(--site-bg)] p-5">
                  <h3 className="font-[family-name:var(--site-font-display)] text-lg">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--site-text-muted)]">
                      {item.description}
                    </p>
                  )}
                </div>
              </>
            )

            return item.href ? (
              <SafeLink
                key={item.title}
                href={item.href}
                className="block bg-[var(--site-surface)] transition-colors hover:bg-[var(--site-surface-raised)]"
              >
                {content}
              </SafeLink>
            ) : (
              <div key={item.title} className="bg-[var(--site-surface)]">
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
