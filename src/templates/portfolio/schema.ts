import { z } from 'zod'

/**
 * The portfolio/personal-brand template's configuration contract — a fourth family
 * alongside corporate, restaurant, and real-estate (see src/templates/parseConfig.ts),
 * not a reuse of any of them: a professional's content (selected work, skills,
 * experience, testimonials) doesn't map onto any other family's shape. Follows the
 * same never-throws defaulting pattern as the other three: every field is optional or
 * has a `.default(...)`, risky leaf values `.catch(...)` a safe fallback instead of
 * failing the whole parse, and `family` is a self-describing literal tag so a stored
 * config can be parsed correctly without separately tracking which project it came
 * from.
 */

const httpsUrl = z.string().url().refine((url) => url.startsWith('https://'), 'Must be an https:// URL')
const safeImageUrl = httpsUrl.catch('')
const email = z.string().email().catch('')

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

const projectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(400).optional(),
  category: z.string().max(60).optional(),
  imageUrl: safeImageUrl.optional(),
  date: z.string().max(40).optional(),
  client: z.string().max(80).optional(),
  role: z.string().max(80).optional(),
  tools: z.array(z.string().max(40)).max(10).default([]).catch([]),
  href: href.optional(),
})

const skillGroupSchema = z.object({
  name: z.string().min(1).max(60),
  items: z.array(z.string().max(60)).max(16).default([]).catch([]),
})

const serviceSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(240).optional(),
  href: href.optional(),
})

const experienceEntrySchema = z.object({
  title: z.string().min(1).max(100),
  organization: z.string().max(100).optional(),
  period: z.string().max(60).optional(),
  description: z.string().max(400).optional(),
})

const testimonialSchema = z.object({
  quote: z.string().min(1).max(500),
  author: z.string().min(1).max(80),
  role: z.string().max(100).optional(),
})

export const portfolioConfigSchema = z.object({
  family: z.literal('portfolio').default('portfolio'),

  person: z
    .object({
      name: z.string().min(1).max(80).default('Your Name'),
      role: z.string().max(100).optional(),
      tagline: z.string().max(160).optional(),
      location: z.string().max(120).optional(),
      /** Free-text, project-controlled — e.g. "Available for freelance work" or
       * "Booked through Q1" — never inferred or hardcoded by the renderer itself. */
      availability: z.string().max(80).optional(),
      photoUrl: safeImageUrl.optional(),
    })
    .default({ name: 'Your Name' }),

  logo: z
    .object({
      text: z.string().max(40).optional(),
      imageUrl: safeImageUrl.optional(),
    })
    .default({}),

  nav: z.array(navLinkSchema).max(8).default([]).catch([]),

  hero: z
    .object({
      heading: z.string().min(1).max(140).default('Hello, I build things worth using'),
      subheading: z.string().max(320).optional(),
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema,
    })
    .default({ heading: 'Hello, I build things worth using' }),

  about: z
    .object({
      heading: z.string().max(100).optional(),
      body: z.string().max(1400).optional(),
      imageUrl: safeImageUrl.optional(),
    })
    .default({}),

  work: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
      projects: z.array(projectSchema).max(24).default([]).catch([]),
    })
    .default({ projects: [] }),

  skills: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
      groups: z.array(skillGroupSchema).max(8).default([]).catch([]),
      services: z.array(serviceSchema).max(8).default([]).catch([]),
    })
    .default({ groups: [], services: [] }),

  experience: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
      entries: z.array(experienceEntrySchema).max(16).default([]).catch([]),
    })
    .default({ entries: [] }),

  testimonials: z.array(testimonialSchema).max(6).default([]).catch([]),

  contact: z
    .object({
      email: email.optional(),
      ctaText: z.string().max(240).optional(),
      availability: z.string().max(80).optional(),
      /** External scheduling/contact link (e.g. Calendly) — no contact-form backend
       * is built; this is deliberately just a configurable URL, like the restaurant
       * family's reservationUrl and the real-estate family's inquiryUrl. */
      bookingUrl: httpsUrl.optional().catch(undefined),
      social: z.array(socialLinkSchema).max(8).default([]).catch([]),
    })
    .default({ social: [] }),

  sections: z
    .object({
      about: z.boolean().default(true),
      work: z.boolean().default(true),
      skills: z.boolean().default(true),
      experience: z.boolean().default(true),
      testimonials: z.boolean().default(true),
      contactCta: z.boolean().default(true),
    })
    .default({ about: true, work: true, skills: true, experience: true, testimonials: true, contactCta: true }),

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

export type PortfolioConfig = z.infer<typeof portfolioConfigSchema>
export type PortfolioProject = PortfolioConfig['work']['projects'][number]

/** A fully-defaulted config, used as the safe fallback when input can't be parsed at all. */
export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = portfolioConfigSchema.parse({})

/** Never throws — mirrors parseCorporateConfig/parseRestaurantConfig/parseRealEstateConfig. */
export function parsePortfolioConfig(input: unknown): PortfolioConfig {
  const result = portfolioConfigSchema.safeParse(input)
  return result.success ? result.data : DEFAULT_PORTFOLIO_CONFIG
}
