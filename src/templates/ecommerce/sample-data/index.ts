import { northfieldSupplyCoConfig } from './northfieldSupplyCo'

export interface EcommerceSampleProfile {
  id: string
  name: string
  description: string
  config: typeof northfieldSupplyCoConfig
}

export const ECOMMERCE_SAMPLE_PROFILES: EcommerceSampleProfile[] = [
  {
    id: 'northfield-supply-co',
    name: 'Northfield Supply Co. (outdoor goods)',
    description: 'A small outdoor-lifestyle brand — full shop, cart, and simulated checkout.',
    config: northfieldSupplyCoConfig,
  },
]

export function getEcommerceSampleProfile(id: string | null | undefined): EcommerceSampleProfile {
  return ECOMMERCE_SAMPLE_PROFILES.find((profile) => profile.id === id) ?? ECOMMERCE_SAMPLE_PROFILES[0]
}
