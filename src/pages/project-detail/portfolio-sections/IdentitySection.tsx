import type { PortfolioConfig } from '../../../templates/portfolio'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: PortfolioConfig
  onChange: (next: PortfolioConfig) => void
  disabled?: boolean
}

export function IdentitySection({ config, onChange, disabled }: Props) {
  const { person, logo } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Identity</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Name</span>
          <input
            className={inputClass}
            value={person.name}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, person: { ...person, name: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Role / specialty</span>
          <input
            className={inputClass}
            value={person.role ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, person: { ...person, role: e.target.value } })}
          />
        </label>
      </div>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Tagline</span>
        <input
          className={inputClass}
          value={person.tagline ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, person: { ...person, tagline: e.target.value } })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Location</span>
          <input
            className={inputClass}
            value={person.location ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, person: { ...person, location: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Availability (optional)</span>
          <input
            className={inputClass}
            placeholder="e.g. Available for freelance work"
            value={person.availability ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, person: { ...person, availability: e.target.value } })}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Portrait image URL (https://)</span>
          <input
            className={inputClass}
            placeholder="https://…"
            value={person.photoUrl ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, person: { ...person, photoUrl: e.target.value } })}
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
