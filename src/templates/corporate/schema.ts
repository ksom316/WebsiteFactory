import { z } from 'zod'

/**
 * The corporate template's configuration contract. This is designed to be stored as-is
 * in `project_config_versions.config` (JSONB) — see api/_lib/db/queries/projects.ts.
 *
 * Every field below is either optional or has a `.default(...)`, and risky leaf values
 * (colors, URLs, links) use `.catch(...)` instead of failing the whole parse. That means:
 *   1. `parseCorporateConfig({})` always succeeds and returns a fully-formed config.
 *   2. A config saved by an older version of this schema that's missing newer optional
 *      fields still parses cleanly — new fields just fall back to their defaults.
 *   3. A single malformed field (a bad hex color, an unsafe link) is dropped in favor of
 *      a safe default rather than rejecting an otherwise-valid saved project.
 */

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color like #1F3B4D')

function withHexColorDefault(fallback: string) {
  return hexColor.catch(fallback)
}

const httpsUrl = z.string().url().refine((url) => url.startsWith('https://'), 'Must be an https:// URL')

const safeImageUrl = httpsUrl.catch('')

const email = z.string().email().catch('')

/** Digits, spaces, parentheses, +, - only — enough to build a `tel:` link safely. */
const phone = z
  .string()
  .regex(/^[0-9+().\-\s]{5,24}$/, 'Must look like a phone number')
  .catch('')

/**
 * Internal anchors/paths, mailto:/tel:, and https:// URLs are allowed. Anything else
 * (javascript:, data:, bare "http://", etc.) is rejected and falls back to "#" so a
 * malformed href can never become an executable or unexpected link.
 */
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

const hoursEntrySchema = z.object({
  days: z.string().min(1).max(40),
  hours: z.string().min(1).max(40),
})

const serviceSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
})

const trustItemSchema = z.object({
  label: z.string().min(1).max(60),
  value: z.string().max(60).optional(),
})

const testimonialSchema = z.object({
  quote: z.string().min(1).max(500),
  author: z.string().min(1).max(80),
  role: z.string().max(80).optional(),
})

const highlightSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(240).optional(),
  imageUrl: safeImageUrl.optional(),
  href: href.optional(),
})

export const corporateConfigSchema = z.object({
  /** Self-describing family tag (see src/templates/registry.ts). Defaulted so configs
   * saved before this field existed keep parsing as corporate, exactly as they always
   * have — this is additive, not a reinterpretation of old data. */
  family: z.literal('corporate').default('corporate'),

  /** Which visual design this config renders through. Both variants accept the same shape. */
  variant: z.enum(['premium', 'neutral']).default('neutral'),

  business: z
    .object({
      name: z.string().min(1).max(80).default('Your Business'),
      shortDescription: z.string().max(220).optional(),
      industry: z.string().max(80).optional(),
      location: z.string().max(120).optional(),
    })
    .default({ name: 'Your Business' }),

  logo: z
    .object({
      text: z.string().max(40).optional(),
      imageUrl: safeImageUrl.optional(),
    })
    .default({}),

  brand: z
    .object({
      primaryColor: withHexColorDefault('#1F3B4D'),
      secondaryColor: withHexColorDefault('#C98A3E'),
      /** A hint for sections that offer more than one internal layout treatment. */
      fontStyle: z.enum(['editorial', 'approachable']).default('approachable'),
    })
    .default({ primaryColor: '#1F3B4D', secondaryColor: '#C98A3E', fontStyle: 'approachable' }),

  contact: z
    .object({
      email: email.optional(),
      phone: phone.optional(),
      address: z.string().max(200).optional(),
      hours: z.array(hoursEntrySchema).max(7).default([]).catch([]),
    })
    .default({ hours: [] }),

  nav: z.array(navLinkSchema).max(8).default([]).catch([]),

  hero: z
    .object({
      heading: z.string().min(1).max(140).default('A website that works as hard as you do'),
      subheading: z.string().max(320).optional(),
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema,
      imageUrl: safeImageUrl.optional(),
    })
    .default({ heading: 'A website that works as hard as you do' }),

  about: z
    .object({
      heading: z.string().max(100).optional(),
      body: z.string().max(1400).optional(),
      highlights: z.array(z.string().max(120)).max(6).default([]).catch([]),
    })
    .default({ highlights: [] }),

  services: z.array(serviceSchema).max(8).default([]).catch([]),

  trust: z
    .object({
      heading: z.string().max(100).optional(),
      items: z.array(trustItemSchema).max(6).default([]).catch([]),
    })
    .default({ items: [] }),

  testimonials: z.array(testimonialSchema).max(6).default([]).catch([]),

  highlights: z.array(highlightSchema).max(6).default([]).catch([]),

  contactCta: z
    .object({
      heading: z.string().max(100).optional(),
      body: z.string().max(320).optional(),
      cta: ctaSchema,
    })
    .default({}),

  footer: z
    .object({
      text: z.string().max(200).optional(),
      links: z.array(navLinkSchema).max(6).default([]).catch([]),
    })
    .default({ links: [] }),

  sections: z
    .object({
      about: z.boolean().default(true),
      services: z.boolean().default(true),
      trust: z.boolean().default(true),
      testimonials: z.boolean().default(true),
      highlights: z.boolean().default(true),
      contactCta: z.boolean().default(true),
    })
    .default({
      about: true,
      services: true,
      trust: true,
      testimonials: true,
      highlights: true,
      contactCta: true,
    }),

  seo: z
    .object({
      title: z.string().max(70).optional(),
      description: z.string().max(200).optional(),
      socialImageUrl: safeImageUrl.optional(),
    })
    .default({}),
})

export type CorporateConfig = z.infer<typeof corporateConfigSchema>

/** A fully-defaulted config, used as the safe fallback when input can't be parsed at all. */
export const DEFAULT_CORPORATE_CONFIG: CorporateConfig = corporateConfigSchema.parse({})

/**
 * Never throws. Unparseable input (wrong type entirely, e.g. a string or array) falls
 * back to {@link DEFAULT_CORPORATE_CONFIG}; a plain object with some invalid fields has
 * just those fields replaced by their defaults (see the module doc comment above).
 */
export function parseCorporateConfig(input: unknown): CorporateConfig {
  const result = corporateConfigSchema.safeParse(input)
  return result.success ? result.data : DEFAULT_CORPORATE_CONFIG
}
