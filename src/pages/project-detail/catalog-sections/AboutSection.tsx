import type { CatalogConfig } from '../../../templates/catalog'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: CatalogConfig
  onChange: (next: CatalogConfig) => void
  disabled?: boolean
}

export function AboutSection({ config, onChange, disabled }: Props) {
  const { about } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>About</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Heading</span>
        <input
          className={inputClass}
          value={about.heading ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, about: { ...about, heading: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Story</span>
        <textarea
          className={`${inputClass} min-h-28`}
          value={about.body ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, about: { ...about, body: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Supporting image URL (https://, optional)</span>
        <input
          className={inputClass}
          placeholder="https://…"
          value={about.imageUrl ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, about: { ...about, imageUrl: e.target.value } })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Location (optional)</span>
          <input
            className={inputClass}
            value={about.location ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, about: { ...about, location: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Hours (optional)</span>
          <input
            className={inputClass}
            placeholder="e.g. Wed–Sun, 11am–6pm"
            value={about.hours ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, about: { ...about, hours: e.target.value } })}
          />
        </label>
      </div>
    </fieldset>
  )
}
