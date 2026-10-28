import type { CorporateConfig } from './schema'
import { PremiumSite } from './variants/premium/Site'
import { NeutralSite } from './variants/neutral/Site'

export interface CorporateTemplateProps {
  config: CorporateConfig
}

/**
 * Entry point for the corporate template family. Picks the right variant's renderer
 * for `config.variant` and otherwise knows nothing about which variant exists —
 * variants are added by extending this switch and the registry (see registry.ts).
 *
 * Standalone rendering boundary (see Phase 3 README section): this component and
 * everything under src/templates/corporate/ takes its data entirely through `config`.
 * It does not import anything from api/, src/auth/, or any Neon/session-aware module —
 * an eventual static export only needs to serialize `config` and render this component
 * against it, with no Website Factory backend involved.
 */
export function CorporateTemplate({ config }: CorporateTemplateProps) {
  switch (config.variant) {
    case 'premium':
      return <PremiumSite config={config} />
    case 'neutral':
    default:
      return <NeutralSite config={config} />
  }
}
