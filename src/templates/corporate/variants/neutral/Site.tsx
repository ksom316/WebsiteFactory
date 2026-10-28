import './tokens.css'
import type { CorporateConfig } from '../../schema'
import { NeutralNav } from './sections/Nav'
import { NeutralHero } from './sections/Hero'
import { NeutralAbout } from './sections/About'
import { NeutralServices } from './sections/Services'
import { NeutralTrust } from './sections/Trust'
import { NeutralTestimonials } from './sections/Testimonials'
import { NeutralHighlights } from './sections/Highlights'
import { NeutralContactCta } from './sections/ContactCta'
import { NeutralFooter } from './sections/Footer'

export function NeutralSite({ config }: { config: CorporateConfig }) {
  const { sections } = config

  return (
    <div className="wf-corporate--neutral min-h-screen">
      <NeutralNav config={config} />
      <main>
        <NeutralHero config={config} />
        {sections.about && <NeutralAbout config={config} />}
        {sections.services && <NeutralServices config={config} />}
        {sections.trust && <NeutralTrust config={config} />}
        {sections.testimonials && <NeutralTestimonials config={config} />}
        {sections.highlights && <NeutralHighlights config={config} />}
        {sections.contactCta && <NeutralContactCta config={config} />}
      </main>
      <NeutralFooter config={config} />
    </div>
  )
}
