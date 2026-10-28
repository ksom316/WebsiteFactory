import type { EcommerceConfig } from '../../../templates/ecommerce'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: EcommerceConfig
  onChange: (next: EcommerceConfig) => void
  disabled?: boolean
}

export function IdentitySection({ config, onChange, disabled }: Props) {
  const { store, logo, brand } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Store</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Name</span>
        <input
          className={inputClass}
          value={store.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, store: { ...store, name: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Tagline</span>
        <input
          className={inputClass}
          value={store.tagline ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, store: { ...store, tagline: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Description</span>
        <textarea
          className={`${inputClass} min-h-20`}
          value={store.description ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, store: { ...store, description: e.target.value } })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Logo text</span>
          <input
            className={inputClass}
            value={logo.text ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, logo: { ...logo, text: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Brand color</span>
          <input
            type="color"
            className="h-10 w-full rounded-md border border-border-strong"
            value={brand.primaryColor}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, brand: { ...brand, primaryColor: e.target.value } })}
          />
        </label>
      </div>
    </fieldset>
  )
}
