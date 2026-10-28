import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { PortfolioConfig } from '../../../templates/portfolio'
import { fieldsetClass, inputClass, labelClass, legendClass } from '../formStyles'
import { StringListField } from '../shared/StringListField'

interface Props {
  config: PortfolioConfig
  onChange: (next: PortfolioConfig) => void
  disabled?: boolean
}

export function WorkSection({ config, onChange, disabled }: Props) {
  const { work } = config
  const projects = work.projects

  function updateProject(index: number, patch: Partial<(typeof projects)[number]>) {
    onChange({ ...config, work: { ...work, projects: projects.map((p, i) => (i === index ? { ...p, ...patch } : p)) } })
  }

  function removeProject(index: number) {
    onChange({ ...config, work: { ...work, projects: projects.filter((_, i) => i !== index) } })
  }

  function moveProject(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= projects.length) return
    const next = [...projects]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange({ ...config, work: { ...work, projects: next } })
  }

  function addProject() {
    if (projects.length >= 24) return
    onChange({ ...config, work: { ...work, projects: [...projects, { title: 'New project', tools: [] }] } })
  }

  return (
    <fieldset className={fieldsetClass}>
      <legend className={legendClass}>Selected work</legend>

      <label className="space-y-1.5 block">
        <span className={labelClass}>Section heading</span>
        <input
          className={inputClass}
          value={work.heading ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, work: { ...work, heading: e.target.value } })}
        />
      </label>

      <div className="space-y-4">
        {projects.map((project, index) => (
          <div key={index} className="rounded-md border border-border-strong p-3">
            <div className="flex items-start gap-2">
              <input
                className={`${inputClass} flex-1 font-semibold`}
                aria-label={`Project ${index + 1} title`}
                value={project.title}
                disabled={disabled}
                onChange={(e) => updateProject(index, { title: e.target.value })}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => moveProject(index, -1)}
                  aria-label={`Move project ${index + 1} up`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40"
                >
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === projects.length - 1}
                  onClick={() => moveProject(index, 1)}
                  aria-label={`Move project ${index + 1} down`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-40"
                >
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeProject(index)}
                  aria-label={`Remove project ${index + 1}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-text disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Category"
                aria-label={`Project ${index + 1} category`}
                value={project.category ?? ''}
                disabled={disabled}
                onChange={(e) => updateProject(index, { category: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Date (e.g. 2025)"
                aria-label={`Project ${index + 1} date`}
                value={project.date ?? ''}
                disabled={disabled}
                onChange={(e) => updateProject(index, { date: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Client"
                aria-label={`Project ${index + 1} client`}
                value={project.client ?? ''}
                disabled={disabled}
                onChange={(e) => updateProject(index, { client: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Your role"
                aria-label={`Project ${index + 1} role`}
                value={project.role ?? ''}
                disabled={disabled}
                onChange={(e) => updateProject(index, { role: e.target.value })}
              />
            </div>

            <textarea
              className={`${inputClass} mt-2 min-h-16`}
              placeholder="Description"
              aria-label={`Project ${index + 1} description`}
              value={project.description ?? ''}
              disabled={disabled}
              onChange={(e) => updateProject(index, { description: e.target.value })}
            />

            <input
              className={`${inputClass} mt-2`}
              placeholder="Image URL (https://…)"
              aria-label={`Project ${index + 1} image URL`}
              value={project.imageUrl ?? ''}
              disabled={disabled}
              onChange={(e) => updateProject(index, { imageUrl: e.target.value })}
            />

            <input
              className={`${inputClass} mt-2`}
              placeholder="Project link (https://…, optional)"
              aria-label={`Project ${index + 1} link`}
              value={project.href ?? ''}
              disabled={disabled}
              onChange={(e) => updateProject(index, { href: e.target.value })}
            />

            <div className="mt-2">
              <StringListField
                label="Tools/technologies"
                items={project.tools}
                onChange={(tools) => updateProject(index, { tools })}
                placeholder="e.g. React"
                itemAriaLabel={(toolIndex) => `Project ${index + 1} tool ${toolIndex + 1}`}
                addLabel="Add tool"
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      {projects.length < 24 && (
        <button
          type="button"
          disabled={disabled}
          onClick={addProject}
          className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-60"
        >
          Add project
        </button>
      )}
      <p className="text-sm text-text-muted">{projects.length} / 24 projects</p>
    </fieldset>
  )
}
