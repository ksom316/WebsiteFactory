import type { RestaurantConfig } from '../../../templates/restaurant'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: RestaurantConfig
  onChange: (next: RestaurantConfig) => void
  disabled?: boolean
}

export function IdentitySection({ config, onChange, disabled }: Props) {
  const { restaurant, logo } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Restaurant</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Name</span>
        <input
          className={inputClass}
          value={restaurant.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, restaurant: { ...restaurant, name: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Tagline</span>
        <input
          className={inputClass}
          value={restaurant.tagline ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, restaurant: { ...restaurant, tagline: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Description</span>
        <textarea
          className={`${inputClass} min-h-20`}
          value={restaurant.description ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, restaurant: { ...restaurant, description: e.target.value } })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Location</span>
          <input
            className={inputClass}
            value={restaurant.location ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, restaurant: { ...restaurant, location: e.target.value } })}
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
