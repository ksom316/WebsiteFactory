import { useState } from 'react'
import type { Project } from '../../auth/apiClient'
import { Button } from '../../components/ui/Button'
import { fieldsetClass, inputClass, labelClass, legendClass } from './formStyles'

interface Props {
  project: Project
  onSave: (input: { name: string; businessName: string | null; slug: string }) => Promise<void>
  onArchive: () => Promise<void>
  onRestore: () => Promise<void>
  saving: boolean
}

export function MetaForm({ project, onSave, onArchive, onRestore, saving }: Props) {
  const [name, setName] = useState(project.name)
  const [businessName, setBusinessName] = useState(project.businessName ?? '')
  const [slug, setSlug] = useState(project.slug)
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)

  const dirty = name !== project.name || businessName !== (project.businessName ?? '') || slug !== project.slug

  async function handleSave() {
    setSlugError(null)
    try {
      await onSave({ name, businessName: businessName.trim() === '' ? null : businessName, slug })
    } catch (error) {
      setSlugError(error instanceof Error ? error.message : 'Could not save changes')
    }
  }

  return (
    <div className="space-y-5">
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Project details</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className={labelClass}>Project name</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Business name</span>
            <input
              className={inputClass}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={saving}
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className={labelClass}>Slug</span>
            <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} disabled={saving} />
          </label>
        </div>

        {slugError && <p className="text-sm text-danger">{slugError}</p>}

        <Button variant="primary" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save details'}
        </Button>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>{project.status === 'archived' ? 'Restore project' : 'Archive project'}</legend>
        {project.status === 'archived' ? (
          <>
            <p className="text-sm text-text-muted">
              This project is archived. Restoring it sets it back to draft — nothing about its configuration
              history changes.
            </p>
            <Button variant="secondary" disabled={saving} onClick={() => onRestore()}>
              Restore project
            </Button>
          </>
        ) : confirmingArchive ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-text-muted">
              Archiving hides this project from the active list. Its configuration history is kept and it can be
              restored later.
            </p>
            <Button
              variant="primary"
              disabled={saving}
              onClick={async () => {
                await onArchive()
                setConfirmingArchive(false)
              }}
            >
              Confirm archive
            </Button>
            <Button variant="secondary" disabled={saving} onClick={() => setConfirmingArchive(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="secondary" disabled={saving} onClick={() => setConfirmingArchive(true)}>
            Archive project
          </Button>
        )}
      </fieldset>
    </div>
  )
}
