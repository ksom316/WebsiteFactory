import './tokens.css'
import type { RealEstateConfig } from './schema'
import { RealEstateNav } from './sections/Nav'
import { RealEstateHero } from './sections/Hero'
import { RealEstateListings } from './sections/Listings'
import { RealEstatePropertyDetails } from './sections/PropertyDetails'
import { RealEstateAgents } from './sections/Agents'
import { RealEstateContactCta } from './sections/ContactCta'
import { RealEstateFooter } from './sections/Footer'

export interface RealEstateTemplateProps {
  config: RealEstateConfig
}

/**
 * Entry point for the real-estate template family — mirrors
 * src/templates/corporate/CorporateTemplate.tsx and
 * src/templates/restaurant/RestaurantTemplate.tsx's role and standalone rendering
 * boundary: everything under src/templates/real-estate/ takes its data entirely
 * through `config` and imports nothing from api/, src/auth/, or any Neon/session-aware
 * module. Like restaurant, this family has a single design, so there's no variant switch.
 */
export function RealEstateTemplate({ config }: RealEstateTemplateProps) {
  const { sections } = config

  return (
    <div className="wf-real-estate min-h-screen">
      <RealEstateNav config={config} />
      <main>
        <RealEstateHero config={config} />
        {sections.listings && <RealEstateListings config={config} />}
        {sections.listings && <RealEstatePropertyDetails config={config} />}
        {sections.agents && <RealEstateAgents config={config} />}
        <RealEstateContactCta config={config} />
      </main>
      <RealEstateFooter config={config} />
    </div>
  )
}
