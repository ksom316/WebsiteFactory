import type { PortfolioConfig } from '../../templates/portfolio'
import { AboutSection } from './portfolio-sections/AboutSection'
import { ContactSection } from './portfolio-sections/ContactSection'
import { ExperienceSection } from './portfolio-sections/ExperienceSection'
import { PortfolioFooterSection } from './portfolio-sections/FooterSection'
import { PortfolioHeroSection } from './portfolio-sections/HeroSection'
import { IdentitySection } from './portfolio-sections/IdentitySection'
import { SkillsSection } from './portfolio-sections/SkillsSection'
import { TestimonialsSection } from './portfolio-sections/TestimonialsSection'
import { VisibilitySection } from './portfolio-sections/VisibilitySection'
import { WorkSection } from './portfolio-sections/WorkSection'

interface PortfolioConfigFormProps {
  config: PortfolioConfig
  onChange: (next: PortfolioConfig) => void
  disabled?: boolean
}

/**
 * The portfolio family's own configuration editor — a clean, family-specific form
 * (mirroring RestaurantConfigForm.tsx/RealEstateConfigForm.tsx's approach) rather than
 * a generalization of ConfigForm.tsx (the corporate editor), since portfolio's fields
 * (selected work, skill groups, experience timeline, testimonials) don't map onto
 * corporate's sections. See ProjectDetailPage.tsx for which editor renders, chosen by
 * the draft config's `family` tag.
 */
export function PortfolioConfigForm({ config, onChange, disabled }: PortfolioConfigFormProps) {
  return (
    <div className="space-y-5">
      <IdentitySection config={config} onChange={onChange} disabled={disabled} />
      <PortfolioHeroSection config={config} onChange={onChange} disabled={disabled} />
      <AboutSection config={config} onChange={onChange} disabled={disabled} />
      <WorkSection config={config} onChange={onChange} disabled={disabled} />
      <SkillsSection config={config} onChange={onChange} disabled={disabled} />
      <ExperienceSection config={config} onChange={onChange} disabled={disabled} />
      <TestimonialsSection config={config} onChange={onChange} disabled={disabled} />
      <ContactSection config={config} onChange={onChange} disabled={disabled} />
      <VisibilitySection config={config} onChange={onChange} disabled={disabled} />
      <PortfolioFooterSection config={config} onChange={onChange} disabled={disabled} />
    </div>
  )
}
