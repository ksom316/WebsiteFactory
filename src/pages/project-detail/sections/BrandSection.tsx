import type { CorporateConfig } from '../../../templates/corporate'
import { fieldsetClass, helpTextClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: CorporateConfig
  onChange: (next: CorporateConfig) => void
  disabled?: boolean
}

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const valid = HEX_PATTERN.test(value)

  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={valid ? value : '#000000'}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border-strong disabled:opacity-60"
        />
        <input
          aria-label={label}
          className={inputClass}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1F3B4D"
        />
      </div>
      {!valid && <p className={helpTextClass}>Not a valid hex color — it will be reset to a default on save.</p>}
    </div>
  )
}

export function BrandSection({ config, onChange, disabled }: Props) {
  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Brand colors</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField
          label="Primary color"
          value={config.brand.primaryColor}
          disabled={disabled}
          onChange={(value) => onChange({ ...config, brand: { ...config.brand, primaryColor: value } })}
        />
        <ColorField
          label="Secondary color"
          value={config.brand.secondaryColor}
          disabled={disabled}
          onChange={(value) => onChange({ ...config, brand: { ...config.brand, secondaryColor: value } })}
        />
      </div>
    </fieldset>
  )
}
