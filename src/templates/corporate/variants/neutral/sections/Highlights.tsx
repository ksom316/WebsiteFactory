import type { CorporateConfig } from '../../../schema'
import { SafeImage } from '../../../components/SafeImage'
import { SafeLink } from '../../../components/SafeLink'

export function NeutralHighlights({ config }: { config: CorporateConfig }) {
  const { highlights } = config
  if (highlights.length === 0) return null

  return (
    <section className="bg-[var(--site-bg)] py-16 sm:py-20" aria-label="Highlights">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--site-text)]">
          A few highlights
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {highlights.map((item) => {
            const body = (
              <div className="overflow-hidden rounded-2xl bg-[var(--site-surface)]">
                <SafeImage
                  src={item.imageUrl}
                  alt=""
                  fallbackLabel={item.title.slice(0, 2).toUpperCase()}
                  className="h-40 w-full object-cover"
                />
                <div className="p-5">
                  <h3 className="font-semibold text-[var(--site-text)]">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1.5 text-sm text-[var(--site-text-muted)]">{item.description}</p>
                  )}
                </div>
              </div>
            )

            return item.href ? (
              <SafeLink key={item.title} href={item.href} className="block transition-opacity hover:opacity-90">
                {body}
              </SafeLink>
            ) : (
              <div key={item.title}>{body}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
