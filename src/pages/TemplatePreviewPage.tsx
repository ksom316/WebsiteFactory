import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSampleProfile, parseCorporateConfig } from '../templates/corporate'
import { getRestaurantSampleProfile, parseRestaurantConfig } from '../templates/restaurant'
import { getRealEstateSampleProfile, parseRealEstateConfig } from '../templates/real-estate'
import { getPortfolioSampleProfile, parsePortfolioConfig } from '../templates/portfolio'
import { getCatalogSampleProfile, parseCatalogConfig } from '../templates/catalog'
import { getEcommerceSampleProfile, parseEcommerceConfig } from '../templates/ecommerce'
import { AnyTemplate } from '../templates/registry'
import { parseTemplateConfig, UnknownTemplateFamilyError, type AnyTemplateConfig } from '../templates/parseConfig'
import { PREVIEW_CONFIG_MESSAGE, PREVIEW_READY_MESSAGE } from '../components/preview/previewMessages'

/**
 * Deliberately bare — no AppShell, no sidebar, no dashboard chrome. This is the
 * standalone rendering boundary in practice: given a config, it renders only the
 * template (via `AnyTemplate`, which dispatches to whichever family the config's
 * `family` tag identifies), exactly as an eventual static export would. It's still
 * gated behind RequireAuth (see App.tsx) because it's reached from the authenticated
 * showcase/editor, but nothing it renders depends on auth state or any Website Factory
 * API call.
 *
 * Two ways to drive it, both producing the same render path:
 *  - Showcase mode: `?family=&profile=&variant=` in the URL (used by TemplatesShowcasePage).
 *    Reloading the iframe's `src` is fine there — it's a deliberate selection, not typing.
 *  - Draft mode: `?mode=draft` (used by the project editor's live preview). The config
 *    itself never goes in the URL — it arrives via postMessage from the parent window on
 *    every keystroke, so the iframe's `src` stays constant and never reloads while editing.
 */
export function TemplatePreviewPage() {
  const [searchParams] = useSearchParams()
  const isDraftMode = searchParams.get('mode') === 'draft'

  const showcaseConfig = useMemo((): AnyTemplateConfig => {
    const family = searchParams.get('family')
    if (family === 'restaurant') {
      const profile = getRestaurantSampleProfile(searchParams.get('profile'))
      return parseRestaurantConfig(profile.config)
    }
    if (family === 'real-estate') {
      const profile = getRealEstateSampleProfile(searchParams.get('profile'))
      return parseRealEstateConfig(profile.config)
    }
    if (family === 'portfolio') {
      const profile = getPortfolioSampleProfile(searchParams.get('profile'))
      return parsePortfolioConfig(profile.config)
    }
    if (family === 'catalog') {
      const profile = getCatalogSampleProfile(searchParams.get('profile'))
      return parseCatalogConfig(profile.config)
    }
    if (family === 'ecommerce') {
      const profile = getEcommerceSampleProfile(searchParams.get('profile'))
      return parseEcommerceConfig(profile.config)
    }
    const profile = getSampleProfile(searchParams.get('profile'))
    const variantOverride = searchParams.get('variant')
    return parseCorporateConfig({
      ...profile.config,
      variant: variantOverride === 'premium' || variantOverride === 'neutral' ? variantOverride : profile.config.variant,
    })
  }, [searchParams])

  const [draftConfig, setDraftConfig] = useState<AnyTemplateConfig | null>(null)
  // Set only if a draft-mode postMessage ever carries a `family` tag this build doesn't
  // recognize (see parseConfig.ts#resolveFamily) — shown instead of crashing the iframe,
  // since draft messages arrive from our own same-origin parent and should never
  // normally hit this, but failing visibly beats silently rendering the wrong design.
  const [unknownFamilyError, setUnknownFamilyError] = useState<string | null>(null)

  useEffect(() => {
    if (!isDraftMode) return

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      // Only ever trust the embedding parent window (if any) — same defense LivePreviewPanel
      // applies in the other direction when checking messages from this iframe.
      if (event.source !== window.parent) return
      const data = event.data as { type?: unknown; config?: unknown } | null
      if (!data || data.type !== PREVIEW_CONFIG_MESSAGE) return
      try {
        setDraftConfig(parseTemplateConfig(data.config))
        setUnknownFamilyError(null)
      } catch (error) {
        if (error instanceof UnknownTemplateFamilyError) {
          setUnknownFamilyError(error.message)
          return
        }
        throw error
      }
    }

    window.addEventListener('message', handleMessage)
    // Tell the parent window (if any) that this document is ready to receive config —
    // posting before this listener exists would otherwise be a lost message.
    window.parent.postMessage({ type: PREVIEW_READY_MESSAGE }, window.location.origin)

    return () => window.removeEventListener('message', handleMessage)
  }, [isDraftMode])

  if (unknownFamilyError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <p className="text-sm text-red-600">Can't preview this configuration: {unknownFamilyError}</p>
      </div>
    )
  }

  if (isDraftMode) {
    if (!draftConfig) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm text-gray-500">Waiting for preview data…</p>
        </div>
      )
    }
    return <AnyTemplate config={draftConfig} />
  }

  return <AnyTemplate config={showcaseConfig} />
}
