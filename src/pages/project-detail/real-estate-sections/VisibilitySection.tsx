import type { RealEstateConfig } from '../../../templates/real-estate'
import { fieldsetClass, legendClass } from '../formStyles'

interface Props {
  config: RealEstateConfig
  onChange: (next: RealEstateConfig) => void
  disabled?: boolean
}

const SECTION_LABELS: { key: keyof RealEstateConfig['sections']; label: string }[] = [
  { key: 'listings', label: 'Listings' },
  { key: 'agents', label: 'Team' },
  { key: 'inquiry', label: 'Enquiry call to action' },
]

export function VisibilitySection({ config, onChange, disabled }: Props) {
  const { sections } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Sections</legend>
      <div className="space-y-2">
        {SECTION_LABELS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={sections[key]}
              disabled={disabled}
              onChange={(e) => onChange({ ...config, sections: { ...sections, [key]: e.target.checked } })}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
