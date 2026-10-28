import { z } from 'zod'

/**
 * The real-estate template's configuration contract — a third family alongside
 * corporate (src/templates/corporate/schema.ts) and restaurant
 * (src/templates/restaurant/schema.ts), not a reuse of either: an agency's content
 * (property listings, bed/bath/area facts, agent profiles) doesn't map onto either
 * family's shape. Follows the same never-throws defaulting pattern: every field is
 * optional or has a `.default(...)`, risky leaf values `.catch(...)` a safe fallback
 * instead of failing the whole parse, and `family` is a self-describing literal tag
 * (see src/templates/parseConfig.ts) so a stored config can be parsed correctly without
 * separately tracking which project it came from.
 */

const httpsUrl = z.string().url().refine((url) => url.startsWith('https://'), 'Must be an https:// URL')
const safeImageUrl = httpsUrl.catch('')
const email = z.string().email().catch('')
const phone = z
  .string()
  .regex(/^[0-9+().\-\s]{5,24}$/, 'Must look like a phone number')
  .catch('')

/** Same allow-list as the other families' `isSafeHref` — internal anchors/paths,
 * mailto:/tel:, and https:// URLs only. Kept as a separate copy (not a shared import)
 * so this family never depends on another's module — see README.md's "Template
 * families" section for why each family duplicates this instead of sharing one copy. */
function isSafeHref(href: string): boolean {
  if (href === '#' || href.startsWith('#')) return true
  if (href.startsWith('/')) return true
  if (href.startsWith('mailto:')) return /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(href)
  if (href.startsWith('tel:')) return href.length > 4
  if (href.startsWith('https://')) return true
  return false
}

const href = z.string().refine(isSafeHref, 'Unsafe or invalid link').catch('#')

const ctaSchema = z
  .object({
    label: z.string().min(1).max(32),
    href,
  })
  .optional()
  .catch(undefined)

const navLinkSchema = z.object({
  label: z.string().min(1).max(32),
  href,
})

const socialLinkSchema = z.object({
  label: z.string().min(1).max(24),
  href,
})

export const PROPERTY_TYPES = ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'] as const
export const TRANSACTION_TYPES = ['sale', 'rent'] as const

/** A URL-safe id generated from the listing title at parse time if one wasn't
 * supplied — used as the in-page anchor for that listing's detail section, so a
 * featured-property card's "View details" link is only ever generated alongside a
 * real, matching detail section (see RealEstateTemplate.tsx) rather than guessed. */
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be lowercase letters, numbers, and single hyphens')
  .max(80)
  .optional()

const propertySchema = z.object({
  title: z.string().min(1).max(100),
  slug,
  price: z.string().max(40).optional(),
  location: z.string().max(140).optional(),
  propertyType: z.enum(PROPERTY_TYPES).default('house').catch('house'),
  transactionType: z.enum(TRANSACTION_TYPES).default('sale').catch('sale'),
  bedrooms: z.coerce.number().int().min(0).max(50).optional().catch(undefined),
  bathrooms: z.coerce.number().int().min(0).max(50).optional().catch(undefined),
  /** Free-text so either "1,850 sq ft" or "172 m²" style conventions both work. */
  area: z.string().max(40).optional(),
  description: z.string().max(600).optional(),
  features: z.array(z.string().max(80)).max(12).default([]).catch([]),
  images: z.array(safeImageUrl).max(10).default([]).catch([]),
})

const agentSchema = z.object({
  name: z.string().min(1).max(80),
  title: z.string().max(80).optional(),
  photoUrl: safeImageUrl.optional(),
  email: email.optional(),
  phone: phone.optional(),
})

export const realEstateConfigSchema = z.object({
  family: z.literal('real-estate').default('real-estate'),

  agency: z
    .object({
      name: z.string().min(1).max(80).default('Your Agency'),
      tagline: z.string().max(140).optional(),
      description: z.string().max(400).optional(),
      location: z.string().max(120).optional(),
    })
    .default({ name: 'Your Agency' }),

  logo: z
    .object({
      text: z.string().max(40).optional(),
      imageUrl: safeImageUrl.optional(),
    })
    .default({}),

  nav: z.array(navLinkSchema).max(8).default([]).catch([]),

  hero: z
    .object({
      heading: z.string().min(1).max(140).default('Find a place that feels like home'),
      subheading: z.string().max(320).optional(),
      imageUrl: safeImageUrl.optional(),
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema,
    })
    .default({ heading: 'Find a place that feels like home' }),

  listings: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
      properties: z.array(propertySchema).max(24).default([]).catch([]),
    })
    .default({ properties: [] }),

  agents: z
    .object({
      heading: z.string().max(100).optional(),
      team: z.array(agentSchema).max(12).default([]).catch([]),
    })
    .default({ team: [] }),

  contact: z
    .object({
      email: email.optional(),
      phone: phone.optional(),
      address: z.string().max(200).optional(),
      /** External inquiry/booking link — no CRM or lead-capture backend is built;
       * this is deliberately just a configurable URL the visitor is sent to. */
      inquiryUrl: httpsUrl.optional().catch(undefined),
      social: z.array(socialLinkSchema).max(6).default([]).catch([]),
    })
    .default({ social: [] }),

  sections: z
    .object({
      listings: z.boolean().default(true),
      agents: z.boolean().default(true),
      inquiry: z.boolean().default(true),
    })
    .default({ listings: true, agents: true, inquiry: true }),

  footer: z
    .object({
      text: z.string().max(200).optional(),
      links: z.array(navLinkSchema).max(6).default([]).catch([]),
    })
    .default({ links: [] }),

  seo: z
    .object({
      title: z.string().max(70).optional(),
      description: z.string().max(200).optional(),
      socialImageUrl: safeImageUrl.optional(),
    })
    .default({}),
})

export type RealEstateConfig = z.infer<typeof realEstateConfigSchema>
export type Property = RealEstateConfig['listings']['properties'][number]

/** A fully-defaulted config, used as the safe fallback when input can't be parsed at all. */
export const DEFAULT_REAL_ESTATE_CONFIG: RealEstateConfig = realEstateConfigSchema.parse({})

/** Never throws — mirrors parseCorporateConfig/parseRestaurantConfig. Also fills in a
 * stable per-listing `slug` (derived from the title) for any property that didn't
 * supply one, since the renderer uses it as the detail-section anchor id. */
export function parseRealEstateConfig(input: unknown): RealEstateConfig {
  const result = realEstateConfigSchema.safeParse(input)
  if (!result.success) return DEFAULT_REAL_ESTATE_CONFIG

  const seenSlugs = new Set<string>()
  const properties = result.data.listings.properties.map((property, index) => {
    let candidate = property.slug || suggestSlug(property.title) || `property-${index + 1}`
    while (seenSlugs.has(candidate)) candidate = `${candidate}-${index + 1}`
    seenSlugs.add(candidate)
    return { ...property, slug: candidate }
  })

  return { ...result.data, listings: { ...result.data.listings, properties } }
}

function suggestSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}
