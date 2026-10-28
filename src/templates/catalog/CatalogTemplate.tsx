import './tokens.css'
import type { CatalogConfig } from './schema'
import { CatalogNav } from './sections/Nav'
import { CatalogHero } from './sections/Hero'
import { CatalogShop } from './sections/Shop'
import { CatalogFeatured } from './sections/Featured'
import { CatalogAbout } from './sections/About'
import { CatalogContactCta } from './sections/ContactCta'
import { CatalogFooter } from './sections/Footer'

export interface CatalogTemplateProps {
  config: CatalogConfig
}

/**
 * Entry point for the catalog (product discovery/inquiry) template family — mirrors
 * the other four families' standalone rendering boundary: everything under
 * src/templates/catalog/ takes its data entirely through `config` and imports nothing
 * from api/, src/auth/, or any Neon/session-aware module. Like restaurant,
 * real-estate, and portfolio, this family has a single design, so there's no variant
 * switch.
 */
export function CatalogTemplate({ config }: CatalogTemplateProps) {
  const { sections } = config

  return (
    <div className="wf-catalog min-h-screen">
      <CatalogNav config={config} />
      <main>
        <CatalogHero config={config} />
        {sections.shop && <CatalogShop config={config} />}
        {sections.featured && <CatalogFeatured config={config} />}
        {sections.about && <CatalogAbout config={config} />}
        <CatalogContactCta config={config} />
      </main>
      <CatalogFooter config={config} />
    </div>
  )
}
