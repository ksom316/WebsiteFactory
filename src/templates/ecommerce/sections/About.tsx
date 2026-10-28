import type { EcommerceConfig } from '../schema'
import { SafeImage } from '../components/SafeImage'

export function EcommerceAbout({ config }: { config: EcommerceConfig }) {
  const { about, store } = config
  if (!about.body && !about.imageUrl) return null

  return (
    <section id="about" className="mx-auto max-w-5xl px-6 py-20" aria-label="About">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className={about.imageUrl ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
            {about.heading || 'Our story'}
          </h2>
          {about.body && <p className="mt-5 max-w-2xl leading-relaxed text-[var(--site-text-muted)]">{about.body}</p>}
        </div>
        {about.imageUrl && (
          <div className="lg:col-span-5">
            <SafeImage src={about.imageUrl} alt={store.name} fallbackLabel={store.name} className="aspect-[4/3] w-full rounded-xl object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}
