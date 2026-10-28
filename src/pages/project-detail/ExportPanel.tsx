import { AlertTriangle, Download } from 'lucide-react'
import { useRef, useState } from 'react'
import { ApiError, exportProject, type ConfigVersion, type Project } from '../../auth/apiClient'
import { getTemplateLabel } from '../../templates/parseConfig'

interface Props {
  project: Project
  latestVersion: ConfigVersion | undefined
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

/** Triggers a browser download for an in-memory blob without navigating the page. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ExportPanel({ project, latestVersion }: Props) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastExported, setLastExported] = useState<string | null>(null)
  // A ref, not just `exporting` state, guards re-entrancy: two clicks dispatched before
  // React has re-rendered (e.g. a fast double click) would otherwise both see the same
  // stale `exporting === false` closure value.
  const inFlightRef = useRef(false)

  if (!latestVersion) return null

  const variantLabel = getTemplateLabel(latestVersion.config)

  async function handleExport() {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setExporting(true)
    setError(null)
    setLastExported(null)
    try {
      const { blob, filename } = await exportProject(project.id)
      downloadBlob(blob, filename)
      setLastExported(filename)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not export the website — try again.')
    } finally {
      inFlightRef.current = false
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-text">Export website</p>
        <p className="text-sm text-text-muted">
          Exports version {latestVersion.versionNumber} of {project.name} (saved {formatDate(latestVersion.createdAt)}) as
          a standalone {variantLabel} website — not your current unsaved draft, if any.
        </p>
        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {error}
          </p>
        )}
        {lastExported && !error && <p className="text-sm text-text-muted">Downloaded {lastExported}.</p>}
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-3.5 py-2 text-sm font-medium text-text transition-colors hover:border-text-faint disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        {exporting ? 'Exporting…' : 'Export website'}
      </button>
    </div>
  )
}
