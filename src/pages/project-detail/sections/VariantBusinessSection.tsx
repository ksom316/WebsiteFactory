import type { CorporateConfig } from '../../../templates/corporate'
import { useRadioGroup } from '../../../hooks/useRadioGroup'
import { fieldsetClass, helpTextClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: CorporateConfig
  onChange: (next: CorporateConfig) => void
  disabled?: boolean
}

const VARIANTS = [
  { id: 'premium', label: 'Premium Agency / Technology' },
  { id: 'neutral', label: 'Neutral Business' },
] as const

export function VariantBusinessSection({ config, onChange, disabled }: Props) {
  const variantGroup = useRadioGroup({
    value: config.variant,
    onChange: (variant) => onChange({ ...config, variant }),
    values: VARIANTS.map((v) => v.id),
  })

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Business &amp; variant</legend>

      <div {...variantGroup.groupProps} aria-label="Design variant" className="flex gap-2">
        {VARIANTS.map((variant) => (
          <button
            key={variant.id}
            type="button"
            {...variantGroup.getItemProps(variant.id)}
            disabled={disabled}
            onClick={() => onChange({ ...config, variant: variant.id })}
            className={`rounded-md border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
              config.variant === variant.id
                ? 'border-accent bg-accent/10 text-accent-strong'
                : 'border-border-strong text-text-muted hover:text-text'
            }`}
          >
            {variant.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Business name</span>
          <input
            className={inputClass}
            value={config.business.name}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, business: { ...config.business, name: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Industry</span>
          <input
            className={inputClass}
            value={config.business.industry ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, business: { ...config.business, industry: e.target.value } })}
          />
        </label>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="block space-y-1.5">
            <span className={labelClass}>Short description</span>
            <input
              className={inputClass}
              value={config.business.shortDescription ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...config, business: { ...config.business, shortDescription: e.target.value } })
              }
            />
          </label>
          <p className={helpTextClass}>Used for SEO and brief summaries. Keep it under a sentence.</p>
        </div>
        <label className="space-y-1.5">
          <span className={labelClass}>Location</span>
          <input
            className={inputClass}
            value={config.business.location ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, business: { ...config.business, location: e.target.value } })}
          />
        </label>
      </div>
    </fieldset>
  )
}
