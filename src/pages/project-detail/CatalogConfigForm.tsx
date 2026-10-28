import type { CatalogConfig } from '../../templates/catalog'
import { AboutSection } from './catalog-sections/AboutSection'
import { ContactSection } from './catalog-sections/ContactSection'
import { CatalogFooterSection } from './catalog-sections/FooterSection'
import { FeaturedSection } from './catalog-sections/FeaturedSection'
import { CatalogHeroSection } from './catalog-sections/HeroSection'
import { IdentitySection } from './catalog-sections/IdentitySection'
import { ProductsSection } from './catalog-sections/ProductsSection'
import { VisibilitySection } from './catalog-sections/VisibilitySection'

interface CatalogConfigFormProps {
  config: CatalogConfig
  onChange: (next: CatalogConfig) => void
  disabled?: boolean
}

/**
 * The catalog family's own configuration editor — a clean, family-specific form
 * (mirroring RestaurantConfigForm.tsx/RealEstateConfigForm.tsx/PortfolioConfigForm.tsx's
 * approach) rather than a generalization of ConfigForm.tsx (the corporate editor),
 * since catalog's fields (a product collection with prices/images/attributes, a
 * featured-product picker) don't map onto corporate's sections. See
 * ProjectDetailPage.tsx for which editor renders, chosen by the draft config's
 * `family` tag.
 */
export function CatalogConfigForm({ config, onChange, disabled }: CatalogConfigFormProps) {
  return (
    <div className="space-y-5">
      <IdentitySection config={config} onChange={onChange} disabled={disabled} />
      <CatalogHeroSection config={config} onChange={onChange} disabled={disabled} />
      <ProductsSection config={config} onChange={onChange} disabled={disabled} />
      <FeaturedSection config={config} onChange={onChange} disabled={disabled} />
      <AboutSection config={config} onChange={onChange} disabled={disabled} />
      <ContactSection config={config} onChange={onChange} disabled={disabled} />
      <VisibilitySection config={config} onChange={onChange} disabled={disabled} />
      <CatalogFooterSection config={config} onChange={onChange} disabled={disabled} />
    </div>
  )
}
