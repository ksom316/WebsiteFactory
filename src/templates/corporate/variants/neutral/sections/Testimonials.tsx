import type { CorporateConfig } from '../../../schema'

export function NeutralTestimonials({ config }: { config: CorporateConfig }) {
  const { testimonials } = config
  if (testimonials.length === 0) return null

  return (
    <section id="testimonials" className="bg-[var(--site-surface)] py-16 sm:py-20" aria-label="What people say">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--site-text)]">What people say</h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.author}
              className="rounded-2xl bg-[var(--site-bg)] p-7"
            >
              <blockquote className="text-[15px] leading-relaxed text-[var(--site-text)]">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-[var(--site-text-muted)]">
                {testimonial.author}
                {testimonial.role && <span className="font-normal"> — {testimonial.role}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
