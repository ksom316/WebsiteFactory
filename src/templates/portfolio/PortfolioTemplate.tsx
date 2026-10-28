import './tokens.css'
import type { PortfolioConfig } from './schema'
import { PortfolioNav } from './sections/Nav'
import { PortfolioHero } from './sections/Hero'
import { PortfolioAbout } from './sections/About'
import { PortfolioWork } from './sections/Work'
import { PortfolioSkills } from './sections/Skills'
import { PortfolioExperience } from './sections/Experience'
import { PortfolioTestimonials } from './sections/Testimonials'
import { PortfolioContactCta } from './sections/ContactCta'
import { PortfolioFooter } from './sections/Footer'

export interface PortfolioTemplateProps {
  config: PortfolioConfig
}

/**
 * Entry point for the portfolio/personal-brand template family — mirrors the other
 * three families' standalone rendering boundary: everything under
 * src/templates/portfolio/ takes its data entirely through `config` and imports
 * nothing from api/, src/auth/, or any Neon/session-aware module. Like restaurant and
 * real-estate, this family has a single design, so there's no variant switch.
 */
export function PortfolioTemplate({ config }: PortfolioTemplateProps) {
  const { sections } = config

  return (
    <div className="wf-portfolio min-h-screen">
      <PortfolioNav config={config} />
      <main>
        <PortfolioHero config={config} />
        {sections.about && <PortfolioAbout config={config} />}
        {sections.work && <PortfolioWork config={config} />}
        {sections.skills && <PortfolioSkills config={config} />}
        {sections.experience && <PortfolioExperience config={config} />}
        {sections.testimonials && <PortfolioTestimonials config={config} />}
        <PortfolioContactCta config={config} />
      </main>
      <PortfolioFooter config={config} />
    </div>
  )
}
