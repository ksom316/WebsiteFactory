import { meridianRealtyConfig } from './meridianRealty'

export interface RealEstateSampleProfile {
  id: string
  name: string
  description: string
  config: typeof meridianRealtyConfig
}

export const REAL_ESTATE_SAMPLE_PROFILES: RealEstateSampleProfile[] = [
  {
    id: 'meridian-realty',
    name: 'Meridian & Co (residential & commercial agency)',
    description: 'An independent agency — premium, editorial, architectural content.',
    config: meridianRealtyConfig,
  },
]

export function getRealEstateSampleProfile(id: string | null | undefined): RealEstateSampleProfile {
  return REAL_ESTATE_SAMPLE_PROFILES.find((profile) => profile.id === id) ?? REAL_ESTATE_SAMPLE_PROFILES[0]
}
