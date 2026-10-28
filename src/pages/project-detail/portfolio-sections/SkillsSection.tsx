import { X } from 'lucide-react'
import type { PortfolioConfig } from '../../../templates/portfolio'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'
import { StringListField } from '../shared/StringListField'

interface Props {
  config: PortfolioConfig
  onChange: (next: PortfolioConfig) => void
  disabled?: boolean
}

export function SkillsSection({ config, onChange, disabled }: Props) {
  const { skills } = config
  const groups = skills.groups
  const services = skills.services

  function updateGroupName(index: number, name: string) {
    onChange({ ...config, skills: { ...skills, groups: groups.map((g, i) => (i === index ? { ...g, name } : g)) } })
  }

  function updateGroupItems(index: number, items: string[]) {
    onChange({ ...config, skills: { ...skills, groups: groups.map((g, i) => (i === index ? { ...g, items } : g)) } })
  }

  function removeGroup(index: number) {
    onChange({ ...config, skills: { ...skills, groups: groups.filter((_, i) => i !== index) } })
  }

  function addGroup() {
    if (groups.length >= 8) return
    onChange({ ...config, skills: { ...skills, groups: [...groups, { name: 'New group', items: [] }] } })
  }

  function updateService(index: number, field: 'title' | 'description' | 'href', value: string) {
    onChange({ ...config, skills: { ...skills, services: services.map((s, i) => (i === index ? { ...s, [field]: value } : s)) } })
  }

  function removeService(index: number) {
    onChange({ ...config, skills: { ...skills, services: services.filter((_, i) => i !== index) } })
  }

  function addService() {
    if (services.length >= 8) return
    onChange({ ...config, skills: { ...skills, services: [...services, { title: 'New service' }] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Skills & services</legend>

      <div className="space-y-3">
        <p className={labelClass}>Skill groups</p>
        {groups.map((group, index) => (
          <div key={index} className="rounded-md border border-border-strong p-2">
            <div className="flex items-start gap-2">
              <input
                className={`${inputClass} flex-1`}
                placeholder="Group name (e.g. Design)"
                aria-label={`Skill group ${index + 1} name`}
                value={group.name}
                disabled={disabled}
                onChange={(e) => updateGroupName(index, e.target.value)}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeGroup(index)}
                aria-label={`Remove skill group ${index + 1}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2">
              <StringListField
                label="Items"
                items={group.items}
                onChange={(items) => updateGroupItems(index, items)}
                placeholder="e.g. Figma"
                itemAriaLabel={(itemIndex) => `Skill group ${index + 1} item ${itemIndex + 1}`}
                addLabel="Add item"
                disabled={disabled}
              />
            </div>
          </div>
        ))}
        {groups.length < 8 && (
          <button type="button" disabled={disabled} onClick={addGroup} className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60">
            Add skill group
          </button>
        )}
      </div>

      <div className="space-y-3">
        <p className={labelClass}>Services</p>
        {services.map((service, index) => (
          <div key={index} className="flex items-start gap-2 rounded-md border border-border-strong p-2">
            <div className="flex-1 space-y-1.5">
              <input
                className={inputClass}
                placeholder="Title"
                aria-label={`Service ${index + 1} title`}
                value={service.title}
                disabled={disabled}
                onChange={(e) => updateService(index, 'title', e.target.value)}
              />
              <textarea
                className={`${inputClass} min-h-14`}
                placeholder="Description"
                aria-label={`Service ${index + 1} description`}
                value={service.description ?? ''}
                disabled={disabled}
                onChange={(e) => updateService(index, 'description', e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Link (https://…, optional)"
                aria-label={`Service ${index + 1} link`}
                value={service.href ?? ''}
                disabled={disabled}
                onChange={(e) => updateService(index, 'href', e.target.value)}
              />
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeService(index)}
              aria-label={`Remove service ${index + 1}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ))}
        {services.length < 8 && (
          <button type="button" disabled={disabled} onClick={addService} className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60">
            Add service
          </button>
        )}
      </div>
    </fieldset>
  )
}
