import type { CorporateConfig } from '../../../templates/corporate'
import { fieldsetClass, legendClass } from '../formStyles'

interface Props {
  config: CorporateConfig
  onChange: (next: CorporateConfig) => void
  disabled?: boolean
}

const SECTION_LABELS: { key: keyof CorporateConfig['sections']; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'trust', label: 'Trust indicators' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'highlights', label: 'Highlights / portfolio' },
  { key: 'contactCta', label: 'Contact call to action' },
]

export function VisibilitySection({ config, onChange, disabled }: Props) {
  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Section visibility</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {SECTION_LABELS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2.5 text-sm text-text">
            <input
              type="checkbox"
              checked={config.sections[key]}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...config, sections: { ...config.sections, [key]: e.target.checked } })
              }
              className="h-4 w-4 rounded border-border-strong accent-accent disabled:opacity-60"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
