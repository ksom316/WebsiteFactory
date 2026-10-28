import type { RealEstateConfig } from '../../../templates/real-estate'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: RealEstateConfig
  onChange: (next: RealEstateConfig) => void
  disabled?: boolean
}

export function IdentitySection({ config, onChange, disabled }: Props) {
  const { agency, logo } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Agency</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Name</span>
        <input
          className={inputClass}
          value={agency.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, agency: { ...agency, name: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Tagline</span>
        <input
          className={inputClass}
          value={agency.tagline ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, agency: { ...agency, tagline: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Description</span>
        <textarea
          className={`${inputClass} min-h-20`}
          value={agency.description ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, agency: { ...agency, description: e.target.value } })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Location</span>
          <input
            className={inputClass}
            value={agency.location ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, agency: { ...agency, location: e.target.value } })}
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
