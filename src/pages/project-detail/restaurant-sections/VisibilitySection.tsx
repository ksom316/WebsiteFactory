import type { RestaurantConfig } from '../../../templates/restaurant'
import { fieldsetClass, legendClass } from '../formStyles'

interface Props {
  config: RestaurantConfig
  onChange: (next: RestaurantConfig) => void
  disabled?: boolean
}

const SECTION_LABELS: { key: keyof RestaurantConfig['sections']; label: string }[] = [
  { key: 'menu', label: 'Menu' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'hours', label: 'Hours' },
  { key: 'reservation', label: 'Reservation call to action' },
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
