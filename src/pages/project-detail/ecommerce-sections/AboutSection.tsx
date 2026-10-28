import type { EcommerceConfig } from '../../../templates/ecommerce'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: EcommerceConfig
  onChange: (next: EcommerceConfig) => void
  disabled?: boolean
}

export function AboutSection({ config, onChange, disabled }: Props) {
  const { about } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>About</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Heading</span>
        <input className={inputClass} value={about.heading ?? ''} disabled={disabled} onChange={(e) => onChange({ ...config, about: { ...about, heading: e.target.value } })} />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Story</span>
        <textarea className={`${inputClass} min-h-28`} value={about.body ?? ''} disabled={disabled} onChange={(e) => onChange({ ...config, about: { ...about, body: e.target.value } })} />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Supporting image URL (https://, optional)</span>
        <input className={inputClass} placeholder="https://…" value={about.imageUrl ?? ''} disabled={disabled} onChange={(e) => onChange({ ...config, about: { ...about, imageUrl: e.target.value } })} />
      </label>
    </fieldset>
  )
}
