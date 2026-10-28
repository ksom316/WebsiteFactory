import type { CorporateConfig } from '../../templates/corporate'
import { AboutSection } from './sections/AboutSection'
import { BrandSection } from './sections/BrandSection'
import { ContactSection } from './sections/ContactSection'
import { HeroSection } from './sections/HeroSection'
import { SeoSection } from './sections/SeoSection'
import { ServicesSection } from './sections/ServicesSection'
import { VariantBusinessSection } from './sections/VariantBusinessSection'
import { VisibilitySection } from './sections/VisibilitySection'

interface ConfigFormProps {
  config: CorporateConfig
  onChange: (next: CorporateConfig) => void
  disabled?: boolean
}

/**
 * A structured settings form over the shared corporate config contract
 * (src/templates/corporate/schema.ts) — grouped into focused sections rather than one
 * long form. This is Phase 4's configuration editor, not the Phase 5 visual editor.
 */
export function ConfigForm({ config, onChange, disabled }: ConfigFormProps) {
  return (
    <div className="space-y-5">
      <VariantBusinessSection config={config} onChange={onChange} disabled={disabled} />
      <HeroSection config={config} onChange={onChange} disabled={disabled} />
      <BrandSection config={config} onChange={onChange} disabled={disabled} />
      <AboutSection config={config} onChange={onChange} disabled={disabled} />
      <ServicesSection config={config} onChange={onChange} disabled={disabled} />
      <ContactSection config={config} onChange={onChange} disabled={disabled} />
      <VisibilitySection config={config} onChange={onChange} disabled={disabled} />
      <SeoSection config={config} onChange={onChange} disabled={disabled} />
    </div>
  )
}
