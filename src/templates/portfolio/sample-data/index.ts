import { lenaAshfordConfig } from './lenaAshford'

export interface PortfolioSampleProfile {
  id: string
  name: string
  description: string
  config: typeof lenaAshfordConfig
}

export const PORTFOLIO_SAMPLE_PROFILES: PortfolioSampleProfile[] = [
  {
    id: 'lena-ashford',
    name: 'Lena Ashford (product designer)',
    description: 'A freelance product designer — editorial, confident, personal content.',
    config: lenaAshfordConfig,
  },
]

export function getPortfolioSampleProfile(id: string | null | undefined): PortfolioSampleProfile {
  return PORTFOLIO_SAMPLE_PROFILES.find((profile) => profile.id === id) ?? PORTFOLIO_SAMPLE_PROFILES[0]
}
