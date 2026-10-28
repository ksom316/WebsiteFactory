import type { CorporateConfig } from '../../../templates/corporate'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: CorporateConfig
  onChange: (next: CorporateConfig) => void
  disabled?: boolean
}

export function SeoSection({ config, onChange, disabled }: Props) {
  const { seo } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>SEO</legend>
      <label className="space-y-1.5 block">
        <span className={labelClass}>Title</span>
        <input
          className={inputClass}
          value={seo.title ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, seo: { ...seo, title: e.target.value } })}
        />
      </label>
      <label className="space-y-1.5 block">
        <span className={labelClass}>Description</span>
        <textarea
          className={`${inputClass} min-h-16`}
          value={seo.description ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, seo: { ...seo, description: e.target.value } })}
        />
      </label>
    </fieldset>
  )
}
