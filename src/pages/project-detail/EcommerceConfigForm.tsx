import type { EcommerceConfig } from '../../templates/ecommerce'
import { AboutSection } from './ecommerce-sections/AboutSection'
import { CheckoutSection } from './ecommerce-sections/CheckoutSection'
import { ContactSection } from './ecommerce-sections/ContactSection'
import { EcommerceFooterSection } from './ecommerce-sections/FooterSection'
import { EcommerceHeroSection } from './ecommerce-sections/HeroSection'
import { IdentitySection } from './ecommerce-sections/IdentitySection'
import { ProductsSection } from './ecommerce-sections/ProductsSection'
import { TestimonialsSection } from './ecommerce-sections/TestimonialsSection'
import { VisibilitySection } from './ecommerce-sections/VisibilitySection'

interface EcommerceConfigFormProps {
  config: EcommerceConfig
  onChange: (next: EcommerceConfig) => void
  disabled?: boolean
}

/**
 * The e-commerce family's own configuration editor — mirroring the other
 * non-corporate families' dedicated-editor approach rather than generalizing the
 * corporate `ConfigForm.tsx`, since this family's fields (products with
 * variants/stock/pricing, shipping options, demo checkout wording) don't map onto
 * corporate's sections. See ProjectDetailPage.tsx for which editor renders, chosen
 * by the draft config's `family` tag.
 */
export function EcommerceConfigForm({ config, onChange, disabled }: EcommerceConfigFormProps) {
  return (
    <div className="space-y-5">
      <IdentitySection config={config} onChange={onChange} disabled={disabled} />
      <EcommerceHeroSection config={config} onChange={onChange} disabled={disabled} />
      <ProductsSection config={config} onChange={onChange} disabled={disabled} />
      <CheckoutSection config={config} onChange={onChange} disabled={disabled} />
      <AboutSection config={config} onChange={onChange} disabled={disabled} />
      <TestimonialsSection config={config} onChange={onChange} disabled={disabled} />
      <ContactSection config={config} onChange={onChange} disabled={disabled} />
      <VisibilitySection config={config} onChange={onChange} disabled={disabled} />
      <EcommerceFooterSection config={config} onChange={onChange} disabled={disabled} />
    </div>
  )
}
