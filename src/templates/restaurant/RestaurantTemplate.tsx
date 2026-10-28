import './tokens.css'
import type { RestaurantConfig } from './schema'
import { RestaurantNav } from './sections/Nav'
import { RestaurantHero } from './sections/Hero'
import { RestaurantMenu } from './sections/Menu'
import { RestaurantGallery } from './sections/Gallery'
import { RestaurantHours } from './sections/Hours'
import { RestaurantContactCta } from './sections/ContactCta'
import { RestaurantFooter } from './sections/Footer'

export interface RestaurantTemplateProps {
  config: RestaurantConfig
}

/**
 * Entry point for the restaurant template family — mirrors
 * src/templates/corporate/CorporateTemplate.tsx's role and standalone rendering
 * boundary: everything under src/templates/restaurant/ takes its data entirely through
 * `config` and imports nothing from api/, src/auth/, or any Neon/session-aware module.
 * Unlike corporate, this family has a single design, so there's no variant switch here.
 */
export function RestaurantTemplate({ config }: RestaurantTemplateProps) {
  const { sections } = config

  return (
    <div className="wf-restaurant min-h-screen">
      <RestaurantNav config={config} />
      <main>
        <RestaurantHero config={config} />
        {sections.menu && <RestaurantMenu config={config} />}
        {sections.gallery && <RestaurantGallery config={config} />}
        {sections.hours && <RestaurantHours config={config} />}
        <RestaurantContactCta config={config} />
      </main>
      <RestaurantFooter config={config} />
    </div>
  )
}
