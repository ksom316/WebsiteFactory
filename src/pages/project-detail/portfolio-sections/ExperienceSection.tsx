import { X } from 'lucide-react'
import type { PortfolioConfig } from '../../../templates/portfolio'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: PortfolioConfig
  onChange: (next: PortfolioConfig) => void
  disabled?: boolean
}

export function ExperienceSection({ config, onChange, disabled }: Props) {
  const { experience } = config
  const entries = experience.entries

  function updateEntry(index: number, field: 'title' | 'organization' | 'period' | 'description', value: string) {
    onChange({ ...config, experience: { ...experience, entries: entries.map((e, i) => (i === index ? { ...e, [field]: value } : e)) } })
  }

  function removeEntry(index: number) {
    onChange({ ...config, experience: { ...experience, entries: entries.filter((_, i) => i !== index) } })
  }

  function addEntry() {
    if (entries.length >= 16) return
    onChange({ ...config, experience: { ...experience, entries: [...entries, { title: 'New role' }] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Experience</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Section heading</span>
        <input
          className={inputClass}
          value={experience.heading ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, experience: { ...experience, heading: e.target.value } })}
        />
      </label>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={index} className="rounded-md border border-border-strong p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    placeholder="Title (e.g. Lead Designer)"
                    aria-label={`Experience ${index + 1} title`}
                    value={entry.title}
                    disabled={disabled}
                    onChange={(e) => updateEntry(index, 'title', e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Organization"
                    aria-label={`Experience ${index + 1} organization`}
                    value={entry.organization ?? ''}
                    disabled={disabled}
                    onChange={(e) => updateEntry(index, 'organization', e.target.value)}
                  />
                </div>
                <input
                  className={inputClass}
                  placeholder="Period (e.g. 2023 — Present)"
                  aria-label={`Experience ${index + 1} period`}
                  value={entry.period ?? ''}
                  disabled={disabled}
                  onChange={(e) => updateEntry(index, 'period', e.target.value)}
                />
                <textarea
                  className={`${inputClass} min-h-16`}
                  placeholder="Description"
                  aria-label={`Experience ${index + 1} description`}
                  value={entry.description ?? ''}
                  disabled={disabled}
                  onChange={(e) => updateEntry(index, 'description', e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeEntry(index)}
                aria-label={`Remove experience entry ${index + 1}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {entries.length < 16 && (
        <button type="button" disabled={disabled} onClick={addEntry} className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60">
          Add experience entry
        </button>
      )}
    </fieldset>
  )
}
