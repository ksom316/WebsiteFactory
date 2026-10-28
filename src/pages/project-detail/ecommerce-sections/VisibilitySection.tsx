import type { EcommerceConfig } from '../../../templates/ecommerce'
import { fieldsetClass, legendClass } from '../formStyles'

interface Props {
  config: EcommerceConfig
  onChange: (next: EcommerceConfig) => void
  disabled?: boolean
}

const SECTION_LABELS: { key: keyof EcommerceConfig['sections']; label: string }[] = [
  { key: 'shop', label: 'Shop (search & filtering)' },
  { key: 'featured', label: 'Featured products' },
  { key: 'about', label: 'About' },
  { key: 'testimonials', label: 'Testimonials' },
]

export function VisibilitySection({ config, onChange, disabled }: Props) {
  const { sections } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Sections</legend>
      <div className="space-y-2">
        {SECTION_LABELS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={sections[key]} disabled={disabled} onChange={(e) => onChange({ ...config, sections: { ...sections, [key]: e.target.checked } })} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
