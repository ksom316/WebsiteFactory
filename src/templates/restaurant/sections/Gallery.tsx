import type { RestaurantConfig } from '../schema'
import { SafeImage } from '../components/SafeImage'

export function RestaurantGallery({ config }: { config: RestaurantConfig }) {
  const { gallery, restaurant } = config
  if (gallery.images.length === 0) return null

  return (
    <section id="gallery" className="bg-[var(--site-surface-raised)] py-20" aria-label="Gallery">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-10 text-center font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          {gallery.heading || 'Gallery'}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.images.map((image, index) => (
            <figure key={`${image.imageUrl}-${index}`} className="overflow-hidden rounded-lg">
              <SafeImage
                src={image.imageUrl}
                alt={image.caption || restaurant.name}
                fallbackLabel={restaurant.name}
                className="aspect-square w-full object-cover"
              />
              {image.caption && <figcaption className="mt-1.5 text-xs text-[var(--site-text-muted)]">{image.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
