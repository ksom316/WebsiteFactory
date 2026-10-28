import type { PortfolioConfig } from '../../../templates/portfolio'
import { fieldsetClass, legendClass } from '../formStyles'

interface Props {
  config: PortfolioConfig
  onChange: (next: PortfolioConfig) => void
  disabled?: boolean
}

const SECTION_LABELS: { key: keyof PortfolioConfig['sections']; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'work', label: 'Selected work' },
  { key: 'skills', label: 'Skills & services' },
  { key: 'experience', label: 'Experience' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'contactCta', label: 'Contact call to action' },
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
