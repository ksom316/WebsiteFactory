import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { CorporateConfig } from '../../../templates/corporate'
import { fieldsetClass, inputClass, legendClass } from '../formStyles'

interface Props {
  config: CorporateConfig
  onChange: (next: CorporateConfig) => void
  disabled?: boolean
}

export function ServicesSection({ config, onChange, disabled }: Props) {
  const { services } = config

  function updateService(index: number, field: 'title' | 'description', value: string) {
    const next = services.map((service, i) => (i === index ? { ...service, [field]: value } : service))
    onChange({ ...config, services: next })
  }

  function removeService(index: number) {
    onChange({ ...config, services: services.filter((_, i) => i !== index) })
  }

  function moveService(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= services.length) return
    const next = [...services]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange({ ...config, services: next })
  }

  function addService() {
    if (services.length >= 8) return
    onChange({ ...config, services: [...services, { title: 'New service', description: '' }] })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Services</legend>

      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="rounded-md border border-border-strong p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  className={inputClass}
                  aria-label={`Service ${index + 1} title`}
                  value={service.title}
                  disabled={disabled}
                  onChange={(e) => updateService(index, 'title', e.target.value)}
                />
                <textarea
                  className={`${inputClass} min-h-16`}
                  aria-label={`Service ${index + 1} description`}
                  value={service.description ?? ''}
                  disabled={disabled}
                  onChange={(e) => updateService(index, 'description', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => moveService(index, -1)}
                  aria-label={`Move service ${index + 1} up`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40"
                >
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === services.length - 1}
                  onClick={() => moveService(index, 1)}
                  aria-label={`Move service ${index + 1} down`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40"
                >
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeService(index)}
                  aria-label={`Remove service ${index + 1}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length < 8 && (
        <button
          type="button"
          disabled={disabled}
          onClick={addService}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add service
        </button>
      )}
      <p className="text-sm text-text-muted">{services.length} / 8 services</p>
    </fieldset>
  )
}
