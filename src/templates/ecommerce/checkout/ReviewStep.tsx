import type { ShippingOption } from '../schema'
import { formatMoney } from '../components/currency'
import { shippingPriceMinor } from '../components/cart'
import { useCart } from '../components/useCart'
import type { CheckoutAddress, CheckoutContactInfo } from './types'

interface Props {
  contact: CheckoutContactInfo
  address: CheckoutAddress
  shippingOption: ShippingOption
  currency: string
  demoNotice: string
  onBack: () => void
  onNext: () => void
}

export function ReviewStep({ contact, address, shippingOption, currency, demoNotice, onBack, onNext }: Props) {
  const { totals } = useCart()
  const shippingMinor = shippingPriceMinor(shippingOption)
  const totalMinor = totals.subtotalMinor + shippingMinor

  return (
    <div className="space-y-5">
      <h3 className="font-[family-name:var(--site-font-display)] text-xl font-semibold">Review your order</h3>

      <div className="space-y-1 text-sm">
        <p className="font-medium">{contact.name}</p>
        <p className="text-[var(--site-text-muted)]">{contact.email}</p>
        <p className="text-[var(--site-text-muted)]">
          {address.line1}, {address.city} {address.postalCode}, {address.country}
        </p>
        <p className="text-[var(--site-text-muted)]">{shippingOption.label}</p>
      </div>

      <ul className="space-y-2 border-t border-[var(--site-border)] pt-4 text-sm">
        {totals.items.map(({ line, product, lineTotalMinor }) => (
          <li key={`${line.productSlug}-${JSON.stringify(line.variantSelection)}`} className="flex justify-between gap-3">
            <span>
              {product.name} × {line.quantity}
            </span>
            <span className="font-medium">{formatMoney(lineTotalMinor, currency)}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-1 border-t border-[var(--site-border)] pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--site-text-muted)]">Subtotal</span>
          <span>{formatMoney(totals.subtotalMinor, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--site-text-muted)]">Shipping</span>
          <span>{formatMoney(shippingMinor, currency)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(totalMinor, currency)}</span>
        </div>
      </div>

      <p className="rounded-md bg-[var(--site-surface-raised)] p-3 text-xs text-[var(--site-text-muted)]">{demoNotice}</p>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-full border border-[var(--site-border)] px-5 py-3 text-sm font-medium hover:border-[var(--site-accent)]">
          Back
        </button>
        <button type="button" onClick={onNext} className="flex-1 rounded-full bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-[var(--site-accent-contrast)] hover:bg-[var(--site-accent-strong)]">
          Continue to payment
        </button>
      </div>
    </div>
  )
}
