import { parseCorporateConfig, type CorporateConfig } from './corporate/schema.js'
import { CORPORATE_TEMPLATE_ID } from './corporate/registry.js'
import { parseRestaurantConfig, type RestaurantConfig } from './restaurant/schema.js'
import { RESTAURANT_TEMPLATE_ID } from './restaurant/registry.js'
import { parseRealEstateConfig, type RealEstateConfig } from './real-estate/schema.js'
import { REAL_ESTATE_TEMPLATE_ID } from './real-estate/registry.js'
import { parsePortfolioConfig, type PortfolioConfig } from './portfolio/schema.js'
import { PORTFOLIO_TEMPLATE_ID } from './portfolio/registry.js'
import { parseCatalogConfig, type CatalogConfig } from './catalog/schema.js'
import { CATALOG_TEMPLATE_ID } from './catalog/registry.js'
import { parseEcommerceConfig, type EcommerceConfig } from './ecommerce/schema.js'
import { ECOMMERCE_TEMPLATE_ID } from './ecommerce/registry.js'

/**
 * The template-family model's server-safe half — parsing/typing only, no React
 * components — so API handlers and db query modules (which run as plain Node/Vercel
 * serverless code) can resolve and validate configs without pulling in any JSX. The
 * rendering half (the `AnyTemplate` dispatcher component) lives in registry.tsx, which
 * re-exports everything here plus that component for frontend use.
 *
 * See registry.tsx's header comment for the full family-model writeup and for how to
 * add a seventh family.
 */
export const TEMPLATE_FAMILY_IDS = [
  CORPORATE_TEMPLATE_ID,
  RESTAURANT_TEMPLATE_ID,
  REAL_ESTATE_TEMPLATE_ID,
  PORTFOLIO_TEMPLATE_ID,
  CATALOG_TEMPLATE_ID,
  ECOMMERCE_TEMPLATE_ID,
] as const
export type TemplateFamilyId = (typeof TEMPLATE_FAMILY_IDS)[number]

export type AnyTemplateConfig =
  | CorporateConfig
  | RestaurantConfig
  | RealEstateConfig
  | PortfolioConfig
  | CatalogConfig
  | EcommerceConfig

export interface TemplateFamilyMeta {
  id: TemplateFamilyId
  name: string
  description: string
}

export const TEMPLATE_FAMILIES: TemplateFamilyMeta[] = [
  {
    id: CORPORATE_TEMPLATE_ID,
    name: 'Corporate',
    description: 'A professional services website, available in Premium and Neutral design variants.',
  },
  {
    id: RESTAURANT_TEMPLATE_ID,
    name: 'Restaurant',
    description: 'A food-and-hospitality website with a menu, hours, gallery, and reservation link.',
  },
  {
    id: REAL_ESTATE_TEMPLATE_ID,
    name: 'Real Estate',
    description: 'A real-estate agency website with property listings, agent profiles, and enquiries.',
  },
  {
    id: PORTFOLIO_TEMPLATE_ID,
    name: 'Portfolio',
    description: 'A personal brand or portfolio website with selected work, skills, and testimonials.',
  },
  {
    id: CATALOG_TEMPLATE_ID,
    name: 'Catalog',
    description: 'A product discovery and inquiry website with search, filtering, and product details.',
  },
  {
    id: ECOMMERCE_TEMPLATE_ID,
    name: 'E-commerce',
    description: 'A demo storefront with a cart and simulated checkout (no real payments).',
  },
]

/**
 * Thrown by {@link resolveFamily}/{@link parseTemplateConfig} when raw input carries an
 * explicit `family` tag that isn't one of {@link TEMPLATE_FAMILY_IDS} (e.g. a typo, a
 * future family this build doesn't know about, or corrupted data) — see
 * {@link resolveFamily}'s header comment for why this is a throw rather than a silent
 * fallback. Every call site that reaches this through an API route is already wrapped
 * in a try/catch that reports a generic 500 (see api/_lib/errors.ts#handleApiError),
 * so this fails the one request safely rather than crashing the server or silently
 * mis-rendering unrelated data as corporate.
 */
export class UnknownTemplateFamilyError extends Error {
  readonly family: unknown

  constructor(family: unknown) {
    super(`Unknown template family: ${typeof family === 'string' ? family : JSON.stringify(family)}`)
    this.name = 'UnknownTemplateFamilyError'
    this.family = family
  }
}

/**
 * The `family` a raw config value resolves to — used by API handlers that need to
 * branch (e.g. which structural validation gate to apply) before handing the value to
 * {@link parseTemplateConfig} itself.
 *
 * Two distinct cases are NOT treated the same:
 *   - No `family` key at all → defaults to `corporate`. This is the backward-compatible
 *     case: every config saved before this field existed has no `family` key, and must
 *     keep parsing exactly as it always did.
 *   - A `family` key present but set to something other than a known id → throws
 *     {@link UnknownTemplateFamilyError} instead of also defaulting to corporate. A
 *     config that was deliberately tagged (by this app or a future version of it) with
 *     a family this build doesn't recognize is a data-integrity problem, not an old
 *     record — rendering it as if it were corporate would silently show the wrong
 *     design for data that was never corporate to begin with.
 */
export function resolveFamily(input: unknown): TemplateFamilyId {
  if (input && typeof input === 'object' && 'family' in input) {
    const value = (input as { family?: unknown }).family
    if ((TEMPLATE_FAMILY_IDS as readonly unknown[]).includes(value)) return value as TemplateFamilyId
    throw new UnknownTemplateFamilyError(value)
  }
  return CORPORATE_TEMPLATE_ID
}

/**
 * Peeks the `family` tag on raw, untrusted input (e.g. a JSONB column's contents) and
 * parses it with the matching family's own schema. Input with no recognizable `family`
 * tag at all (including every config saved before this field existed) falls back to the
 * corporate parser, which is exactly how it already behaved — but input explicitly
 * tagged with an unrecognized family throws {@link UnknownTemplateFamilyError} rather
 * than being silently coerced into some other family's shape; see {@link resolveFamily}.
 */
export function parseTemplateConfig(input: unknown): AnyTemplateConfig {
  const family = resolveFamily(input)
  if (family === RESTAURANT_TEMPLATE_ID) return parseRestaurantConfig(input)
  if (family === REAL_ESTATE_TEMPLATE_ID) return parseRealEstateConfig(input)
  if (family === PORTFOLIO_TEMPLATE_ID) return parsePortfolioConfig(input)
  if (family === CATALOG_TEMPLATE_ID) return parseCatalogConfig(input)
  if (family === ECOMMERCE_TEMPLATE_ID) return parseEcommerceConfig(input)
  return parseCorporateConfig(input)
}

/** A short label for the design a config renders through — used by panels that show the
 * project's current template at a glance (ExportPanel, DeploymentPanel, ProjectDetailPage). */
export function getTemplateLabel(config: AnyTemplateConfig): string {
  if (config.family === RESTAURANT_TEMPLATE_ID) return 'Restaurant'
  if (config.family === REAL_ESTATE_TEMPLATE_ID) return 'Real Estate'
  if (config.family === PORTFOLIO_TEMPLATE_ID) return 'Portfolio'
  if (config.family === CATALOG_TEMPLATE_ID) return 'Catalog'
  if (config.family === ECOMMERCE_TEMPLATE_ID) return 'E-commerce'
  return config.variant === 'premium' ? 'Premium Agency / Technology' : 'Neutral Business'
}
