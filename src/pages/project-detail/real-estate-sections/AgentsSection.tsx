import { X } from 'lucide-react'
import type { RealEstateConfig } from '../../../templates/real-estate'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'

interface Props {
  config: RealEstateConfig
  onChange: (next: RealEstateConfig) => void
  disabled?: boolean
}

export function AgentsSection({ config, onChange, disabled }: Props) {
  const { agents } = config
  const team = agents.team

  function updateAgent(index: number, field: 'name' | 'title' | 'photoUrl' | 'email' | 'phone', value: string) {
    onChange({ ...config, agents: { ...agents, team: team.map((a, i) => (i === index ? { ...a, [field]: value } : a)) } })
  }

  function removeAgent(index: number) {
    onChange({ ...config, agents: { ...agents, team: team.filter((_, i) => i !== index) } })
  }

  function addAgent() {
    if (team.length >= 12) return
    onChange({ ...config, agents: { ...agents, team: [...team, { name: 'New team member' }] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Team</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Section heading</span>
        <input
          className={inputClass}
          value={agents.heading ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, agents: { ...agents, heading: e.target.value } })}
        />
      </label>

      <div className="space-y-3">
        {team.map((agent, index) => (
          <div key={index} className="rounded-md border border-border-strong p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  className={inputClass}
                  placeholder="Name"
                  aria-label={`Team member ${index + 1} name`}
                  value={agent.name}
                  disabled={disabled}
                  onChange={(e) => updateAgent(index, 'name', e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Title"
                  aria-label={`Team member ${index + 1} title`}
                  value={agent.title ?? ''}
                  disabled={disabled}
                  onChange={(e) => updateAgent(index, 'title', e.target.value)}
                />
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="Email"
                    aria-label={`Team member ${index + 1} email`}
                    value={agent.email ?? ''}
                    disabled={disabled}
                    onChange={(e) => updateAgent(index, 'email', e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Phone"
                    aria-label={`Team member ${index + 1} phone`}
                    value={agent.phone ?? ''}
                    disabled={disabled}
                    onChange={(e) => updateAgent(index, 'phone', e.target.value)}
                  />
                </div>
                <input
                  className={inputClass}
                  placeholder="Photo URL (https://…)"
                  aria-label={`Team member ${index + 1} photo URL`}
                  value={agent.photoUrl ?? ''}
                  disabled={disabled}
                  onChange={(e) => updateAgent(index, 'photoUrl', e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeAgent(index)}
                aria-label={`Remove team member ${index + 1}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {team.length < 12 && (
        <button
          type="button"
          disabled={disabled}
          onClick={addAgent}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add team member
        </button>
      )}
    </fieldset>
  )
}
