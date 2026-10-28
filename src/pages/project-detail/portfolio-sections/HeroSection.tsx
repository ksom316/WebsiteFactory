import type { PortfolioConfig } from '../../../templates/portfolio'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: PortfolioConfig
  onChange: (next: PortfolioConfig) => void
  disabled?: boolean
}

export function PortfolioHeroSection({ config, onChange, disabled }: Props) {
  const { hero } = config

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Hero</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Heading</span>
        <input
          className={inputClass}
          value={hero.heading}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, hero: { ...hero, heading: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Supporting text</span>
        <textarea
          className={`${inputClass} min-h-20`}
          value={hero.subheading ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, hero: { ...hero, subheading: e.target.value } })}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className={labelClass}>Primary call to action</span>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="Label"
              value={hero.primaryCta?.label ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...config, hero: { ...hero, primaryCta: { label: e.target.value, href: hero.primaryCta?.href ?? '#' } } })
              }
            />
            <input
              className={inputClass}
              placeholder="Link (#work, /path, https://…)"
              value={hero.primaryCta?.href ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...config, hero: { ...hero, primaryCta: { label: hero.primaryCta?.label ?? '', href: e.target.value } } })
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className={labelClass}>Secondary call to action</span>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="Label"
              value={hero.secondaryCta?.label ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...config,
                  hero: { ...hero, secondaryCta: { label: e.target.value, href: hero.secondaryCta?.href ?? '#' } },
                })
              }
            />
            <input
              className={inputClass}
              placeholder="Link"
              value={hero.secondaryCta?.href ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...config,
                  hero: { ...hero, secondaryCta: { label: hero.secondaryCta?.label ?? '', href: e.target.value } },
                })
              }
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}
