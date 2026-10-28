import { gildedFigConfig } from './gildedFig'

export interface RestaurantSampleProfile {
  id: string
  name: string
  description: string
  config: typeof gildedFigConfig
}

export const RESTAURANT_SAMPLE_PROFILES: RestaurantSampleProfile[] = [
  {
    id: 'gilded-fig',
    name: 'The Gilded Fig (Mediterranean bistro)',
    description: 'A neighborhood bistro — warm, editorial, food-forward content.',
    config: gildedFigConfig,
  },
]

export function getRestaurantSampleProfile(id: string | null | undefined): RestaurantSampleProfile {
  return RESTAURANT_SAMPLE_PROFILES.find((profile) => profile.id === id) ?? RESTAURANT_SAMPLE_PROFILES[0]
}
