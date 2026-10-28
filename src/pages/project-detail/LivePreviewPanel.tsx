import { AlertTriangle, RotateCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ViewportToggle, type Viewport } from '../../components/preview/ViewportToggle'
import { PREVIEW_CONFIG_MESSAGE, PREVIEW_READY_MESSAGE } from '../../components/preview/previewMessages'
import type { AnyTemplateConfig } from '../../templates/parseConfig'

const READY_TIMEOUT_MS = 8000

interface Props {
  config: AnyTemplateConfig
}

/**
 * Renders the project's draft configuration through the real template for its family
 * (via the `AnyTemplate` dispatcher inside TemplatePreviewPage), inside the same
 * `/templates/preview` iframe the showcase uses (see TemplatePreviewPage) —
 * `?mode=draft` instead of `?profile=&variant=`. The iframe's `src` never changes while
 * editing; every keystroke is sent over postMessage instead, so there's no reload
 * flicker and no risk of the preview's JS touching the dashboard's cookies or session —
 * it's a same-origin iframe that only ever receives a plain config object.
 */
export function LivePreviewPanel({ config }: Props) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Ready handshake: wait for the iframe's own "I'm listening" message before ever
  // posting to it, and give up with a visible error if that never arrives.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      if ((event.data as { type?: unknown } | null)?.type !== PREVIEW_READY_MESSAGE) return
      setReady(true)
      setLoadError(false)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (ready) return
    const timeout = setTimeout(() => setLoadError(true), READY_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [ready])

  // Every draft change (and the first one, once ready) is pushed into the iframe.
  useEffect(() => {
    if (!ready) return
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage({ type: PREVIEW_CONFIG_MESSAGE, config }, window.location.origin)
  }, [ready, config])

  function handleReload() {
    setReady(false)
    setLoadError(false)
    // Same-origin iframe, so we can reload its document directly and get a fresh
    // ready handshake without touching `src` (which some linters flag as a no-op,
    // even though browsers do treat re-assignment as a reload).
    iframeRef.current?.contentWindow?.location.reload()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-text">Live preview</p>
        <ViewportToggle viewport={viewport} onChange={setViewport} />
      </div>

      <div className="relative flex justify-center overflow-auto rounded-lg border border-border bg-bg p-4">
        {loadError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-bg/95 p-6 text-center">
            <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-sm text-text-muted">The preview didn't load in time.</p>
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-text hover:border-text-faint"
            >
              <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              Reload preview
            </button>
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="Live project preview"
          src="/templates/preview?mode=draft"
          className="h-[1400px] rounded-md border border-border-strong bg-white transition-[width] duration-200"
          style={{ width: viewport === 'mobile' ? '390px' : '100%' }}
        />
      </div>
    </div>
  )
}
