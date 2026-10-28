import { CorporateTemplate } from './corporate/CorporateTemplate'
import { RestaurantTemplate } from './restaurant/RestaurantTemplate'
import { RESTAURANT_TEMPLATE_ID } from './restaurant/registry'
import { RealEstateTemplate } from './real-estate/RealEstateTemplate'
import { REAL_ESTATE_TEMPLATE_ID } from './real-estate/registry'
import { PortfolioTemplate } from './portfolio/PortfolioTemplate'
import { PORTFOLIO_TEMPLATE_ID } from './portfolio/registry'
import { CatalogTemplate } from './catalog/CatalogTemplate'
import { CATALOG_TEMPLATE_ID } from './catalog/registry'
import { EcommerceTemplate } from './ecommerce/EcommerceTemplate'
import { ECOMMERCE_TEMPLATE_ID } from './ecommerce/registry'
import type { AnyTemplateConfig } from './parseConfig'

/**
 * The template-family model (see README.md's "Template families" section for the full
 * writeup). A "family" is a fundamentally different schema + renderer (corporate vs.
 * restaurant); a "variant" is a different visual treatment WITHIN a family that shares
 * the same schema (e.g. corporate's premium/neutral).
 *
 * This file holds only the `AnyTemplate` dispatcher component — kept separate from
 * parseConfig.ts (which holds every other family-model export: parsing, labels, the
 * family registry list) so that react-refresh's "a file exporting a component must
 * export only components" rule stays satisfied. Import the dispatcher component from
 * here and everything else from parseConfig.ts.
 *
 * Adding a third family means: write its schema/renderer under src/templates/<id>/
 * (self-describing via a `family` literal default, exactly like the two already here),
 * add one case to parseConfig.ts's `parseTemplateConfig`/`resolveFamily`/`getTemplateLabel`
 * and to this file's `AnyTemplate`, add its `templates` row via a new forward-only
 * migration, and add one case to buildSiteFiles.ts/generateFiles.ts on the export side.
 * No plugin framework, no dynamic registration — a small, explicit, exhaustive switch
 * in each of those places.
 */
export interface AnyTemplateProps {
  config: AnyTemplateConfig
}

/** Renders whichever family's template the config's `family` tag identifies. */
export function AnyTemplate({ config }: AnyTemplateProps) {
  if (config.family === RESTAURANT_TEMPLATE_ID) return <RestaurantTemplate config={config} />
  if (config.family === REAL_ESTATE_TEMPLATE_ID) return <RealEstateTemplate config={config} />
  if (config.family === PORTFOLIO_TEMPLATE_ID) return <PortfolioTemplate config={config} />
  if (config.family === CATALOG_TEMPLATE_ID) return <CatalogTemplate config={config} />
  if (config.family === ECOMMERCE_TEMPLATE_ID) return <EcommerceTemplate config={config} />
  return <CorporateTemplate config={config} />
}
