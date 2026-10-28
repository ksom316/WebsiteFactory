import { AlertTriangle, ArrowLeft, Eye, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ApiError,
  fetchProjectDetail,
  restoreConfigVersion as restoreConfigVersionApi,
  saveConfig,
  updateProjectMeta,
  type ConfigVersion,
  type Project,
} from '../auth/apiClient'
import { EmptyState } from '../components/ui/EmptyState'
import { useRadioGroup } from '../hooks/useRadioGroup'
import { GuardedLink } from '../navigation/GuardedLink'
import { useUnsavedChangesGuard } from '../navigation/useUnsavedChangesGuard'
import { pageTitleClass } from '../styles/typography'
import { ConfigForm } from './project-detail/ConfigForm'
import { DeploymentPanel } from './project-detail/DeploymentPanel'
import { ExportPanel } from './project-detail/ExportPanel'
import { LivePreviewPanel } from './project-detail/LivePreviewPanel'
import { MetaForm } from './project-detail/MetaForm'
import { CatalogConfigForm } from './project-detail/CatalogConfigForm'
import { EcommerceConfigForm } from './project-detail/EcommerceConfigForm'
import { PortfolioConfigForm } from './project-detail/PortfolioConfigForm'
import { RealEstateConfigForm } from './project-detail/RealEstateConfigForm'
import { RestaurantConfigForm } from './project-detail/RestaurantConfigForm'
import { VersionHistory } from './project-detail/VersionHistory'
import { getTemplateLabel, type AnyTemplateConfig } from '../templates/parseConfig'

type LoadState = 'loading' | 'loaded' | 'error'
type Tab = 'config' | 'history' | 'settings'
type MobileView = 'edit' | 'preview'

const TABS: { id: Tab; label: string }[] = [
  { id: 'config', label: 'Configuration' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

const UNSAVED_CONFIG_MESSAGE = 'You have unsaved configuration changes. Leave without saving?'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [project, setProject] = useState<Project | null>(null)
  const [versions, setVersions] = useState<ConfigVersion[]>([])
  const [draft, setDraft] = useState<AnyTemplateConfig | null>(null)
  const [tab, setTab] = useState<Tab>('config')
  const [mobileView, setMobileView] = useState<MobileView>('edit')
  const mobileViewGroup = useRadioGroup<MobileView>({ value: mobileView, onChange: setMobileView, values: ['edit', 'preview'] })
  const [configSaving, setConfigSaving] = useState(false)
  const [configMessage, setConfigMessage] = useState<string | null>(null)
  const [metaSaving, setMetaSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // Kept in sync with `draft` so an in-flight save can tell, once it resolves, whether
  // the user has made further edits in the meantime (see handleSaveConfig).
  const draftRef = useRef(draft)
  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchProjectDetail(id)
      .then((detail) => {
        if (cancelled) return
        setProject(detail.project)
        setVersions(detail.versions)
        setDraft(detail.versions[0]?.config ?? null)
        setLoadState('loaded')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const latestVersion = versions[0]
  const configDirty = draft ? (latestVersion ? JSON.stringify(draft) !== JSON.stringify(latestVersion.config) : true) : false

  useUnsavedChangesGuard(configDirty, UNSAVED_CONFIG_MESSAGE)

  if (!id) return null
  const projectId = id

  if (loadState === 'loading') {
    return <p className="py-16 text-center text-sm text-text-muted">Loading project…</p>
  }

  if (loadState === 'error' || !project || !draft) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this project"
        description="It may have been removed, or something went wrong talking to the server."
        action={
          <GuardedLink to="/projects" className="text-sm font-medium text-accent-strong hover:underline">
            Back to projects
          </GuardedLink>
        }
      />
    )
  }

  async function handleSaveConfig() {
    if (!draft) return
    const submittedDraft = draft
    setConfigSaving(true)
    setConfigMessage(null)
    try {
      const result = await saveConfig(projectId, submittedDraft)
      setVersions((prev) => [result.version, ...prev.filter((v) => v.versionNumber !== result.version.versionNumber)])
      // Only adopt the server's (re-normalized) config as the draft, and only claim
      // "Saved.", if nothing newer has been typed while this request was in flight.
      // Otherwise the baseline (versions) still advances, but the draft and its
      // now-true "Unsaved changes" status are left alone — saying "Saved." here would
      // incorrectly imply the edits made during the save are persisted too.
      if (draftRef.current === submittedDraft) {
        setDraft(result.version.config)
        setConfigMessage(result.changed ? 'Saved.' : 'No changes to save.')
      } else {
        setConfigMessage(null)
      }
    } catch (error) {
      setConfigMessage(error instanceof ApiError ? error.message : 'Could not save — try again.')
    } finally {
      setConfigSaving(false)
    }
  }

  async function handleRestoreVersion(versionNumber: number) {
    if (configDirty && !window.confirm('Restoring will discard your unsaved configuration changes. Continue?')) {
      return
    }
    setRestoring(true)
    try {
      const restored = await restoreConfigVersionApi(projectId, versionNumber)
      setVersions((prev) => [restored, ...prev])
      setDraft(restored.config)
      setConfigMessage(`Restored version ${versionNumber} as version ${restored.versionNumber}.`)
    } finally {
      setRestoring(false)
    }
  }

  async function handleSaveMeta(input: { name: string; businessName: string | null; slug: string }) {
    setMetaSaving(true)
    try {
      const updated = await updateProjectMeta(projectId, input)
      setProject(updated)
    } catch (error) {
      throw new Error(error instanceof ApiError ? error.message : 'Could not save project details', { cause: error })
    } finally {
      setMetaSaving(false)
    }
  }

  async function setStatus(status: 'draft' | 'archived') {
    setMetaSaving(true)
    try {
      const updated = await updateProjectMeta(projectId, { status })
      setProject(updated)
    } finally {
      setMetaSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <GuardedLink to="/projects" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Back to projects
        </GuardedLink>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={pageTitleClass}>{project.name}</h2>
          <p className="text-sm text-text-muted">/{project.slug}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" aria-hidden="true" />
            {project.status}
          </span>
          <span>{getTemplateLabel(draft)}</span>
        </div>
      </div>

      <ExportPanel project={project} latestVersion={latestVersion} />
      <DeploymentPanel project={project} latestVersion={latestVersion} />

      <div role="tablist" aria-label="Project sections" className="flex gap-1 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? 'border-accent text-accent-strong'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'config' && (
        <div role="tabpanel" className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
            <p className="text-sm text-text-muted">
              {configMessage ?? (configDirty ? 'Unsaved changes' : 'Up to date')}
            </p>
            <div className="flex items-center gap-3">
              <div {...mobileViewGroup.groupProps} aria-label="View" className="flex gap-1 lg:hidden">
                <button
                  type="button"
                  {...mobileViewGroup.getItemProps('edit')}
                  onClick={() => setMobileView('edit')}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    mobileView === 'edit'
                      ? 'border-accent bg-accent/10 text-accent-strong'
                      : 'border-border-strong text-text-muted hover:text-text'
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  {...mobileViewGroup.getItemProps('preview')}
                  onClick={() => setMobileView('preview')}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    mobileView === 'preview'
                      ? 'border-accent bg-accent/10 text-accent-strong'
                      : 'border-border-strong text-text-muted hover:text-text'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  Preview
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={configSaving || !configDirty}
                className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {configSaving ? 'Saving…' : 'Save configuration'}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <div className={`space-y-4 lg:col-span-5 lg:block ${mobileView === 'edit' ? '' : 'hidden'}`}>
              {/* Intentionally not disabled while saving — editing must stay possible
                  during an in-flight save (see handleSaveConfig's race handling). */}
              {draft.family === 'restaurant' ? (
                <RestaurantConfigForm config={draft} onChange={setDraft} />
              ) : draft.family === 'real-estate' ? (
                <RealEstateConfigForm config={draft} onChange={setDraft} />
              ) : draft.family === 'portfolio' ? (
                <PortfolioConfigForm config={draft} onChange={setDraft} />
              ) : draft.family === 'catalog' ? (
                <CatalogConfigForm config={draft} onChange={setDraft} />
              ) : draft.family === 'ecommerce' ? (
                <EcommerceConfigForm config={draft} onChange={setDraft} />
              ) : (
                <ConfigForm config={draft} onChange={setDraft} />
              )}
            </div>
            <div className={`lg:sticky lg:top-6 lg:col-span-7 lg:block ${mobileView === 'preview' ? '' : 'hidden'}`}>
              <LivePreviewPanel config={draft} />
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div role="tabpanel">
          <VersionHistory
            versions={versions}
            currentVersionNumber={latestVersion?.versionNumber ?? 0}
            onRestore={handleRestoreVersion}
            restoring={restoring}
          />
        </div>
      )}

      {tab === 'settings' && (
        <div role="tabpanel">
          <MetaForm
            project={project}
            onSave={handleSaveMeta}
            onArchive={() => setStatus('archived')}
            onRestore={() => setStatus('draft')}
            saving={metaSaving}
          />
        </div>
      )}
    </div>
  )
}
