import type { CorporateConfig } from '../../../schema'

export function NeutralTrust({ config }: { config: CorporateConfig }) {
  const { trust } = config
  if (trust.items.length === 0) return null

  return (
    <section className="bg-[var(--site-accent)] py-10" aria-label={trust.heading ?? 'Why choose us'}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-6">
        {trust.items.map((item) => (
          <div
            key={item.label}
            className="rounded-full bg-[var(--site-accent-contrast)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--site-accent-contrast)]"
          >
            {item.value && <span>{item.value} </span>}
            <span className="font-normal opacity-90">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
