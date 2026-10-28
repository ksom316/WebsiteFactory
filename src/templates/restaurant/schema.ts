import { z } from 'zod'

/**
 * The restaurant template's configuration contract — a separate family from
 * `corporateConfigSchema` (src/templates/corporate/schema.ts), not a reuse of it, since
 * a restaurant's content (menu, hours, gallery, reservations) doesn't map onto
 * corporate's shape. Follows the same never-throws defaulting pattern: every field is
 * optional or has a `.default(...)`, risky leaf values `.catch(...)` a safe fallback
 * instead of failing the whole parse, and `family` is a self-describing literal tag
 * (see src/templates/registry.ts) so a stored config can be parsed correctly without
 * separately tracking which project it came from.
 */

const httpsUrl = z.string().url().refine((url) => url.startsWith('https://'), 'Must be an https:// URL')
const safeImageUrl = httpsUrl.catch('')
const email = z.string().email().catch('')
const phone = z
  .string()
  .regex(/^[0-9+().\-\s]{5,24}$/, 'Must look like a phone number')
  .catch('')

/** Same allow-list as the corporate family's `isSafeHref` — internal anchors/paths,
 * mailto:/tel:, and https:// URLs only. Kept as a separate copy (not a shared import)
 * so the restaurant family never depends on corporate's module — see registry.ts for
 * why families are additive, not cross-referencing. */
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

const menuItemSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(220).optional(),
  price: z.string().max(20).optional(),
})

const menuCategorySchema = z.object({
  name: z.string().min(1).max(60),
  items: z.array(menuItemSchema).max(20).default([]).catch([]),
})

const hoursEntrySchema = z.object({
  days: z.string().min(1).max(40),
  hours: z.string().min(1).max(40),
})

const galleryImageSchema = z.object({
  imageUrl: safeImageUrl,
  caption: z.string().max(120).optional(),
})

const socialLinkSchema = z.object({
  label: z.string().min(1).max(24),
  href,
})

export const restaurantConfigSchema = z.object({
  family: z.literal('restaurant').default('restaurant'),

  restaurant: z
    .object({
      name: z.string().min(1).max(80).default('Your Restaurant'),
      tagline: z.string().max(140).optional(),
      description: z.string().max(400).optional(),
      location: z.string().max(120).optional(),
    })
    .default({ name: 'Your Restaurant' }),

  logo: z
    .object({
      text: z.string().max(40).optional(),
      imageUrl: safeImageUrl.optional(),
    })
    .default({}),

  nav: z.array(navLinkSchema).max(8).default([]).catch([]),

  hero: z
    .object({
      heading: z.string().min(1).max(140).default('A table worth the trip'),
      subheading: z.string().max(320).optional(),
      imageUrl: safeImageUrl.optional(),
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema,
    })
    .default({ heading: 'A table worth the trip' }),

  menu: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
      categories: z.array(menuCategorySchema).max(10).default([]).catch([]),
    })
    .default({ categories: [] }),

  gallery: z
    .object({
      heading: z.string().max(100).optional(),
      images: z.array(galleryImageSchema).max(12).default([]).catch([]),
    })
    .default({ images: [] }),

  hours: z.array(hoursEntrySchema).max(7).default([]).catch([]),

  contact: z
    .object({
      email: email.optional(),
      phone: phone.optional(),
      address: z.string().max(200).optional(),
      /** External booking/reservation link — no in-app reservation system is built;
       * this is deliberately just a configurable URL the visitor is sent to. */
      reservationUrl: httpsUrl.optional().catch(undefined),
      social: z.array(socialLinkSchema).max(6).default([]).catch([]),
    })
    .default({ social: [] }),

  sections: z
    .object({
      menu: z.boolean().default(true),
      gallery: z.boolean().default(true),
      hours: z.boolean().default(true),
      reservation: z.boolean().default(true),
    })
    .default({ menu: true, gallery: true, hours: true, reservation: true }),

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

export type RestaurantConfig = z.infer<typeof restaurantConfigSchema>

/** A fully-defaulted config, used as the safe fallback when input can't be parsed at all. */
export const DEFAULT_RESTAURANT_CONFIG: RestaurantConfig = restaurantConfigSchema.parse({})

/** Never throws — mirrors {@link import('../corporate/schema').parseCorporateConfig}. */
export function parseRestaurantConfig(input: unknown): RestaurantConfig {
  const result = restaurantConfigSchema.safeParse(input)
  return result.success ? result.data : DEFAULT_RESTAURANT_CONFIG
}
