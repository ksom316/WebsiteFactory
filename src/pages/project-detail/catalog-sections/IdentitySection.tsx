import type { CatalogConfig } from '../../../templates/catalog'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: CatalogConfig
  onChange: (next: CatalogConfig) => void
  disabled?: boolean
}

export function IdentitySection({ config, onChange, disabled }: Props) {
  const { business, logo } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Business</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Name</span>
        <input
          className={inputClass}
          value={business.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, business: { ...business, name: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Tagline</span>
        <input
          className={inputClass}
          value={business.tagline ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, business: { ...business, tagline: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Description</span>
        <textarea
          className={`${inputClass} min-h-20`}
          value={business.description ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, business: { ...business, description: e.target.value } })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Location</span>
          <input
            className={inputClass}
            value={business.location ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, business: { ...business, location: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Logo text</span>
          <input
            className={inputClass}
            value={logo.text ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, logo: { ...logo, text: e.target.value } })}
          />
        </label>
      </div>
    </fieldset>
  )
}
