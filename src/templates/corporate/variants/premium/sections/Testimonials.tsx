import type { CorporateConfig } from '../../../schema'

export function PremiumTestimonials({ config }: { config: CorporateConfig }) {
  const { testimonials } = config
  if (testimonials.length === 0) return null
  const [first] = testimonials

  return (
    <section id="testimonials" className="border-b border-[var(--site-border)]" aria-label="Client testimonial">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <figure className="max-w-3xl">
          <span
            aria-hidden="true"
            className="font-[family-name:var(--site-font-display)] text-6xl leading-none text-[var(--site-accent)]"
          >
            "
          </span>
          <blockquote className="mt-2 font-[family-name:var(--site-font-display)] text-2xl font-medium leading-snug sm:text-3xl">
            {first.quote}
          </blockquote>
          <figcaption className="mt-6 text-sm text-[var(--site-text-muted)]">
            <span className="font-medium text-[var(--site-text)]">{first.author}</span>
            {first.role && <span> — {first.role}</span>}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
