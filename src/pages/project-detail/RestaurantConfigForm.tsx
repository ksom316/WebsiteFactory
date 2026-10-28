import type { RestaurantConfig } from '../../templates/restaurant'
import { ContactSection } from './restaurant-sections/ContactSection'
import { RestaurantFooterSection } from './restaurant-sections/FooterSection'
import { GallerySection } from './restaurant-sections/GallerySection'
import { RestaurantHeroSection } from './restaurant-sections/HeroSection'
import { HoursSection } from './restaurant-sections/HoursSection'
import { IdentitySection } from './restaurant-sections/IdentitySection'
import { MenuSection } from './restaurant-sections/MenuSection'
import { VisibilitySection } from './restaurant-sections/VisibilitySection'

interface RestaurantConfigFormProps {
  config: RestaurantConfig
  onChange: (next: RestaurantConfig) => void
  disabled?: boolean
}

/**
 * The restaurant family's own configuration editor — a clean, family-specific form
 * rather than a generalization of ConfigForm.tsx (the corporate editor), since
 * restaurant's fields (menu categories/items, hours, gallery, reservation link) don't
 * map onto corporate's sections. Both editors are plain structured forms over their
 * own family's config contract; see ProjectDetailPage.tsx for which one renders,
 * chosen by the draft config's `family` tag.
 */
export function RestaurantConfigForm({ config, onChange, disabled }: RestaurantConfigFormProps) {
  return (
    <div className="space-y-5">
      <IdentitySection config={config} onChange={onChange} disabled={disabled} />
      <RestaurantHeroSection config={config} onChange={onChange} disabled={disabled} />
      <MenuSection config={config} onChange={onChange} disabled={disabled} />
      <GallerySection config={config} onChange={onChange} disabled={disabled} />
      <HoursSection config={config} onChange={onChange} disabled={disabled} />
      <ContactSection config={config} onChange={onChange} disabled={disabled} />
      <VisibilitySection config={config} onChange={onChange} disabled={disabled} />
      <RestaurantFooterSection config={config} onChange={onChange} disabled={disabled} />
    </div>
  )
}
