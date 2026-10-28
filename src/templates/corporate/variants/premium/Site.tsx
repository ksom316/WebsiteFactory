import './tokens.css'
import type { CorporateConfig } from '../../schema'
import { PremiumNav } from './sections/Nav'
import { PremiumHero } from './sections/Hero'
import { PremiumAbout } from './sections/About'
import { PremiumServices } from './sections/Services'
import { PremiumTrust } from './sections/Trust'
import { PremiumTestimonials } from './sections/Testimonials'
import { PremiumHighlights } from './sections/Highlights'
import { PremiumContactCta } from './sections/ContactCta'
import { PremiumFooter } from './sections/Footer'

export function PremiumSite({ config }: { config: CorporateConfig }) {
  const { sections } = config

  return (
    <div className="wf-corporate--premium min-h-screen">
      <PremiumNav config={config} />
      <main>
        <PremiumHero config={config} />
        {sections.about && <PremiumAbout config={config} />}
        {sections.services && <PremiumServices config={config} />}
        {sections.trust && <PremiumTrust config={config} />}
        {sections.testimonials && <PremiumTestimonials config={config} />}
        {sections.highlights && <PremiumHighlights config={config} />}
        {sections.contactCta && <PremiumContactCta config={config} />}
      </main>
      <PremiumFooter config={config} />
    </div>
  )
}
