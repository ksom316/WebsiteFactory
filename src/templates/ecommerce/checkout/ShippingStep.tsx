import { useState, type FormEvent } from 'react'
import type { ShippingOption } from '../schema'
import { formatMoney } from '../components/currency'
import { shippingPriceMinor } from '../components/cart'
import type { CheckoutAddress } from './types'

interface Props {
  value: CheckoutAddress
  shippingOptions: ShippingOption[]
  selectedShippingIndex: number
  currency: string
  onBack: () => void
  onNext: (address: CheckoutAddress, shippingIndex: number) => void
}

export function ShippingStep({ value, shippingOptions, selectedShippingIndex, currency, onBack, onNext }: Props) {
  const [line1, setLine1] = useState(value.line1)
  const [city, setCity] = useState(value.city)
  const [postalCode, setPostalCode] = useState(value.postalCode)
  const [country, setCountry] = useState(value.country)
  const [shippingIndex, setShippingIndex] = useState(selectedShippingIndex)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (line1.trim() === '') nextErrors.line1 = 'Enter a street address.'
    if (city.trim() === '') nextErrors.city = 'Enter a city.'
    if (postalCode.trim() === '') nextErrors.postalCode = 'Enter a postal code.'
    if (country.trim() === '') nextErrors.country = 'Enter a country.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onNext({ line1: line1.trim(), city: city.trim(), postalCode: postalCode.trim(), country: country.trim() }, shippingIndex)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-[family-name:var(--site-font-display)] text-xl font-semibold">Delivery address</h3>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-[var(--site-danger)]">
          Please fix the highlighted fields.
        </p>
      )}
      <div className="space-y-1">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Street address</span>
          <input className="w-full rounded-md border border-[var(--site-border)] px-3 py-2 text-sm" value={line1} onChange={(e) => setLine1(e.target.value)} aria-invalid={Boolean(errors.line1)} />
        </label>
        {errors.line1 && <span className="text-xs text-[var(--site-danger)]">{errors.line1}</span>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block space-y-1">
            <span className="text-sm font-medium">City</span>
            <input className="w-full rounded-md border border-[var(--site-border)] px-3 py-2 text-sm" value={city} onChange={(e) => setCity(e.target.value)} aria-invalid={Boolean(errors.city)} />
          </label>
          {errors.city && <span className="text-xs text-[var(--site-danger)]">{errors.city}</span>}
        </div>
        <div className="space-y-1">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Postal code</span>
            <input className="w-full rounded-md border border-[var(--site-border)] px-3 py-2 text-sm" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} aria-invalid={Boolean(errors.postalCode)} />
          </label>
          {errors.postalCode && <span className="text-xs text-[var(--site-danger)]">{errors.postalCode}</span>}
        </div>
      </div>
      <div className="space-y-1">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Country</span>
          <input className="w-full rounded-md border border-[var(--site-border)] px-3 py-2 text-sm" value={country} onChange={(e) => setCountry(e.target.value)} aria-invalid={Boolean(errors.country)} />
        </label>
        {errors.country && <span className="text-xs text-[var(--site-danger)]">{errors.country}</span>}
      </div>

      {shippingOptions.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium">Shipping option</legend>
          <div role="radiogroup" aria-label="Shipping option" className="mt-2 space-y-2">
            {shippingOptions.map((option, index) => (
              <label key={option.label} className="flex items-center justify-between gap-3 rounded-md border border-[var(--site-border)] px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <input type="radio" name="shipping-option" checked={shippingIndex === index} onChange={() => setShippingIndex(index)} />
                  <span>
                    {option.label}
                    {option.description && <span className="block text-xs text-[var(--site-text-faint)]">{option.description}</span>}
                  </span>
                </span>
                <span className="font-medium">{formatMoney(shippingPriceMinor(option), currency)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-full border border-[var(--site-border)] px-5 py-3 text-sm font-medium hover:border-[var(--site-accent)]">
          Back
        </button>
        <button type="submit" className="flex-1 rounded-full bg-[var(--site-accent)] px-5 py-3 text-sm font-medium text-[var(--site-accent-contrast)] hover:bg-[var(--site-accent-strong)]">
          Review order
        </button>
      </div>
    </form>
  )
}
