import { marlowAndFinchConfig } from './marlowAndFinch'

export interface CatalogSampleProfile {
  id: string
  name: string
  description: string
  config: typeof marlowAndFinchConfig
}

export const CATALOG_SAMPLE_PROFILES: CatalogSampleProfile[] = [
  {
    id: 'marlow-finch',
    name: 'Marlow & Finch (homeware boutique)',
    description: 'An independent homeware boutique — editorial, warm, product-forward content.',
    config: marlowAndFinchConfig,
  },
]

export function getCatalogSampleProfile(id: string | null | undefined): CatalogSampleProfile {
  return CATALOG_SAMPLE_PROFILES.find((profile) => profile.id === id) ?? CATALOG_SAMPLE_PROFILES[0]
}
