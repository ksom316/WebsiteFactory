import type { RestaurantConfig } from '../schema'

export function RestaurantMenu({ config }: { config: RestaurantConfig }) {
  const { menu } = config
  if (menu.categories.length === 0) return null

  return (
    <section id="menu" className="mx-auto max-w-4xl px-6 py-20" aria-label="Menu">
      <div className="mb-12 text-center">
        <h2 className="font-[family-name:var(--site-font-display)] text-3xl font-semibold sm:text-4xl">
          {menu.heading || 'Menu'}
        </h2>
        {menu.intro && <p className="mx-auto mt-4 max-w-xl text-[var(--site-text-muted)]">{menu.intro}</p>}
      </div>

      <div className="space-y-14">
        {menu.categories.map((category) => (
          <div key={category.name}>
            <h3 className="font-[family-name:var(--site-font-display)] mb-6 text-center text-xl font-semibold uppercase tracking-[0.15em] text-[var(--site-accent-strong)]">
              {category.name}
            </h3>
            <ul className="space-y-5">
              {category.items.map((item) => (
                <li key={item.name} className="flex items-baseline justify-between gap-4 border-b border-dotted border-[var(--site-border)] pb-2">
                  <div>
                    <p className="font-medium text-[var(--site-text)]">{item.name}</p>
                    {item.description && <p className="mt-1 text-sm text-[var(--site-text-muted)]">{item.description}</p>}
                  </div>
                  {item.price && <p className="shrink-0 font-[family-name:var(--site-font-display)] text-lg">{item.price}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
