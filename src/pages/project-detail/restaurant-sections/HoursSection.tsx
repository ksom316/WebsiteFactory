import { X } from 'lucide-react'
import type { RestaurantConfig } from '../../../templates/restaurant'
import { fieldsetClass, inputClass, legendClass } from '../formStyles'

interface Props {
  config: RestaurantConfig
  onChange: (next: RestaurantConfig) => void
  disabled?: boolean
}

export function HoursSection({ config, onChange, disabled }: Props) {
  const { hours } = config

  function updateHours(index: number, field: 'days' | 'hours', value: string) {
    onChange({ ...config, hours: hours.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)) })
  }

  function removeHours(index: number) {
    onChange({ ...config, hours: hours.filter((_, i) => i !== index) })
  }

  function addHours() {
    if (hours.length >= 7) return
    onChange({ ...config, hours: [...hours, { days: 'Mon', hours: '5:00pm–10:00pm' }] })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Hours</legend>

      <div className="space-y-2">
        {hours.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              className={inputClass}
              placeholder="Days (e.g. Mon–Thu)"
              aria-label={`Hours ${index + 1} days`}
              value={entry.days}
              disabled={disabled}
              onChange={(e) => updateHours(index, 'days', e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Hours (e.g. 5:00pm–10:00pm)"
              aria-label={`Hours ${index + 1} time`}
              value={entry.hours}
              disabled={disabled}
              onChange={(e) => updateHours(index, 'hours', e.target.value)}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeHours(index)}
              aria-label={`Remove hours entry ${index + 1}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {hours.length < 7 && (
        <button
          type="button"
          disabled={disabled}
          onClick={addHours}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add hours entry
        </button>
      )}
    </fieldset>
  )
}
