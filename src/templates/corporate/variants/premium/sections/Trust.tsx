import type { CorporateConfig } from '../../../schema'

export function PremiumTrust({ config }: { config: CorporateConfig }) {
  const { trust } = config
  if (trust.items.length === 0) return null

  return (
    <section className="border-b border-[var(--site-border)] bg-[var(--site-surface)]" aria-label={trust.heading ?? 'Operating alongside'}>
      <div className="mx-auto max-w-6xl px-6 py-14">
        {trust.heading && (
          <p className="mb-8 text-sm text-[var(--site-text-muted)]">{trust.heading}</p>
        )}
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {trust.items.map((item) => (
            <div key={item.label} className="border-l border-[var(--site-border)] pl-4">
              {item.value && (
                <dd className="font-[family-name:var(--site-font-display)] text-3xl">{item.value}</dd>
              )}
              <dt className="mt-1 text-sm text-[var(--site-text-muted)]">{item.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
