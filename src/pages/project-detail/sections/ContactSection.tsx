import { X } from 'lucide-react'
import type { CorporateConfig } from '../../../templates/corporate'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: CorporateConfig
  onChange: (next: CorporateConfig) => void
  disabled?: boolean
}

export function ContactSection({ config, onChange, disabled }: Props) {
  const { contact } = config

  function updateHour(index: number, field: 'days' | 'hours', value: string) {
    const next = contact.hours.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    onChange({ ...config, contact: { ...contact, hours: next } })
  }

  function removeHour(index: number) {
    onChange({ ...config, contact: { ...contact, hours: contact.hours.filter((_, i) => i !== index) } })
  }

  function addHour() {
    if (contact.hours.length >= 7) return
    onChange({ ...config, contact: { ...contact, hours: [...contact.hours, { days: '', hours: '' }] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Contact</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Email</span>
          <input
            type="email"
            className={inputClass}
            value={contact.email ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, contact: { ...contact, email: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Phone</span>
          <input
            className={inputClass}
            value={contact.phone ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, contact: { ...contact, phone: e.target.value } })}
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className={labelClass}>Address</span>
          <input
            className={inputClass}
            value={contact.address ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, contact: { ...contact, address: e.target.value } })}
          />
        </label>
      </div>

      <div className="space-y-2">
        <span className={labelClass}>Hours</span>
        {contact.hours.map((entry, index) => (
          <div key={index} className="flex gap-2">
            <input
              className={inputClass}
              placeholder="Mon–Fri"
              aria-label={`Hours row ${index + 1} days`}
              value={entry.days}
              disabled={disabled}
              onChange={(e) => updateHour(index, 'days', e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="9:00–17:00"
              aria-label={`Hours row ${index + 1} hours`}
              value={entry.hours}
              disabled={disabled}
              onChange={(e) => updateHour(index, 'hours', e.target.value)}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeHour(index)}
              aria-label={`Remove hours row ${index + 1}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
        {contact.hours.length < 7 && (
          <button
            type="button"
            disabled={disabled}
            onClick={addHour}
            className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
          >
            Add hours row
          </button>
        )}
      </div>
    </fieldset>
  )
}
