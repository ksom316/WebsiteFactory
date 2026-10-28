import { X } from 'lucide-react'
import type { CorporateConfig } from '../../../templates/corporate'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: CorporateConfig
  onChange: (next: CorporateConfig) => void
  disabled?: boolean
}

export function AboutSection({ config, onChange, disabled }: Props) {
  const { about } = config

  function updateHighlight(index: number, value: string) {
    const next = [...about.highlights]
    next[index] = value
    onChange({ ...config, about: { ...about, highlights: next } })
  }

  function removeHighlight(index: number) {
    onChange({ ...config, about: { ...about, highlights: about.highlights.filter((_, i) => i !== index) } })
  }

  function addHighlight() {
    if (about.highlights.length >= 6) return
    onChange({ ...config, about: { ...about, highlights: [...about.highlights, ''] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>About</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Heading</span>
        <input
          className={inputClass}
          value={about.heading ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, about: { ...about, heading: e.target.value } })}
        />
      </label>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Body</span>
        <textarea
          className={`${inputClass} min-h-28`}
          value={about.body ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, about: { ...about, body: e.target.value } })}
        />
      </label>

      <div className="space-y-2">
        <span className={labelClass}>Highlights</span>
        {about.highlights.map((highlight, index) => (
          <div key={index} className="flex gap-2">
            <input
              className={inputClass}
              value={highlight}
              disabled={disabled}
              onChange={(e) => updateHighlight(index, e.target.value)}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeHighlight(index)}
              aria-label={`Remove highlight ${index + 1}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
        {about.highlights.length < 6 && (
          <button
            type="button"
            disabled={disabled}
            onClick={addHighlight}
            className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
          >
            Add highlight
          </button>
        )}
      </div>
    </fieldset>
  )
}
