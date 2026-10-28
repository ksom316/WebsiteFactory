import type { RealEstateConfig } from '../../templates/real-estate'
import { AgentsSection } from './real-estate-sections/AgentsSection'
import { ContactSection } from './real-estate-sections/ContactSection'
import { RealEstateFooterSection } from './real-estate-sections/FooterSection'
import { RealEstateHeroSection } from './real-estate-sections/HeroSection'
import { IdentitySection } from './real-estate-sections/IdentitySection'
import { ListingsSection } from './real-estate-sections/ListingsSection'
import { VisibilitySection } from './real-estate-sections/VisibilitySection'

interface RealEstateConfigFormProps {
  config: RealEstateConfig
  onChange: (next: RealEstateConfig) => void
  disabled?: boolean
}

/**
 * The real-estate family's own configuration editor — a clean, family-specific form
 * (mirroring RestaurantConfigForm.tsx's approach) rather than a generalization of
 * ConfigForm.tsx (the corporate editor), since real-estate's fields (property
 * listings, bed/bath/area facts, agent profiles) don't map onto corporate's sections.
 * See ProjectDetailPage.tsx for which editor renders, chosen by the draft config's
 * `family` tag.
 */
export function RealEstateConfigForm({ config, onChange, disabled }: RealEstateConfigFormProps) {
  return (
    <div className="space-y-5">
      <IdentitySection config={config} onChange={onChange} disabled={disabled} />
      <RealEstateHeroSection config={config} onChange={onChange} disabled={disabled} />
      <ListingsSection config={config} onChange={onChange} disabled={disabled} />
      <AgentsSection config={config} onChange={onChange} disabled={disabled} />
      <ContactSection config={config} onChange={onChange} disabled={disabled} />
      <VisibilitySection config={config} onChange={onChange} disabled={disabled} />
      <RealEstateFooterSection config={config} onChange={onChange} disabled={disabled} />
    </div>
  )
}
