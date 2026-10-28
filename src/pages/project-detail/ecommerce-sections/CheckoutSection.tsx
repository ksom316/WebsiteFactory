import { X } from 'lucide-react'
import type { EcommerceConfig } from '../../../templates/ecommerce'
import { fieldsetClass, helpTextClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: EcommerceConfig
  onChange: (next: EcommerceConfig) => void
  disabled?: boolean
}

export function CheckoutSection({ config, onChange, disabled }: Props) {
  const { checkout } = config
  const shippingOptions = checkout.shippingOptions

  function updateOption(index: number, patch: Partial<(typeof shippingOptions)[number]>) {
    onChange({ ...config, checkout: { ...checkout, shippingOptions: shippingOptions.map((o, i) => (i === index ? { ...o, ...patch } : o)) } })
  }

  function removeOption(index: number) {
    onChange({ ...config, checkout: { ...checkout, shippingOptions: shippingOptions.filter((_, i) => i !== index) } })
  }

  function addOption() {
    if (shippingOptions.length >= 6) return
    onChange({ ...config, checkout: { ...checkout, shippingOptions: [...shippingOptions, { label: 'New shipping option', price: 0 }] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Checkout (demo)</legend>
      <p className={helpTextClass}>
        This demo checkout never takes a real payment or submits a real order — see the exported site's README for the
        full disclosure. Use this section only to configure shipping options and the wording shown to visitors.
      </p>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Demo notice text</span>
        <textarea
          className={`${inputClass} min-h-16`}
          value={checkout.demoNotice}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, checkout: { ...checkout, demoNotice: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Confirmation screen message</span>
        <textarea
          className={`${inputClass} min-h-16`}
          value={checkout.confirmationMessage}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, checkout: { ...checkout, confirmationMessage: e.target.value } })}
        />
      </label>

      <div className="space-y-2">
        <span className={labelClass}>Shipping options</span>
        {shippingOptions.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input className={inputClass} placeholder="Label" aria-label={`Shipping option ${index + 1} label`} value={option.label} disabled={disabled} onChange={(e) => updateOption(index, { label: e.target.value })} />
            <input className={inputClass} placeholder="Description (optional)" aria-label={`Shipping option ${index + 1} description`} value={option.description ?? ''} disabled={disabled} onChange={(e) => updateOption(index, { description: e.target.value })} />
            <input type="number" min={0} step="0.01" className={`${inputClass} w-28`} placeholder="Price" aria-label={`Shipping option ${index + 1} price`} value={option.price ?? ''} disabled={disabled} onChange={(e) => updateOption(index, { price: e.target.value === '' ? undefined : Number(e.target.value) })} />
            <button type="button" disabled={disabled} onClick={() => removeOption(index)} aria-label={`Remove shipping option ${index + 1}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60">
              <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
        {shippingOptions.length < 6 && (
          <button type="button" disabled={disabled} onClick={addOption} className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60">
            Add shipping option
          </button>
        )}
      </div>
    </fieldset>
  )
}
