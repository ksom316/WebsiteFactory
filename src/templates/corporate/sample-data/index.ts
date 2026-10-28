import { fathomConfig } from './fathom'
import { willowCreekConfig } from './willowCreek'

export interface SampleProfile {
  id: string
  name: string
  description: string
  config: typeof fathomConfig
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: 'fathom',
    name: 'Fathom (technology consultancy)',
    description: 'A software engineering studio — grounded, technical, editorial content.',
    config: fathomConfig,
  },
  {
    id: 'willow-creek',
    name: 'Willow Creek Dental (general business)',
    description: 'A family dental practice — warm, local, service-oriented content.',
    config: willowCreekConfig,
  },
]

export function getSampleProfile(id: string | null | undefined): SampleProfile {
  return SAMPLE_PROFILES.find((profile) => profile.id === id) ?? SAMPLE_PROFILES[0]
}
