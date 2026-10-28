import type { RealEstateConfig } from '../../../templates/real-estate'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: RealEstateConfig
  onChange: (next: RealEstateConfig) => void
  disabled?: boolean
}

export function RealEstateFooterSection({ config, onChange, disabled }: Props) {
  const { footer, seo } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Footer & SEO</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Footer text</span>
        <input
          className={inputClass}
          value={footer.text ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, footer: { ...footer, text: e.target.value } })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Page title</span>
          <input
            className={inputClass}
            value={seo.title ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, seo: { ...seo, title: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Meta description</span>
          <input
            className={inputClass}
            value={seo.description ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, seo: { ...seo, description: e.target.value } })}
          />
        </label>
      </div>
    </fieldset>
  )
}
