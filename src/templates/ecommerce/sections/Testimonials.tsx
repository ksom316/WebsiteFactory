import type { EcommerceConfig } from '../schema'

/** Sample/placeholder testimonials must be clearly illustrative — see the sample
 * data's own author labels ("(illustrative example)") rather than anything this
 * component renders, matching the portfolio family's convention. */
export function EcommerceTestimonials({ config }: { config: EcommerceConfig }) {
  const { testimonials } = config
  if (testimonials.length === 0) return null

  return (
    <section className="bg-[var(--site-surface-raised)] py-20" aria-label="Testimonials">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-10 text-center font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          What customers say
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.author} className="rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
              <blockquote className="font-[family-name:var(--site-font-display)] text-lg leading-relaxed">“{testimonial.quote}”</blockquote>
              <figcaption className="mt-4 text-sm text-[var(--site-text-muted)]">
                <span className="font-medium text-[var(--site-text)]">{testimonial.author}</span>
                {testimonial.role ? ` — ${testimonial.role}` : ''}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
