import { z } from 'zod'

/** Lowercase alphanumeric segments separated by single hyphens — no leading/trailing hyphen. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(SLUG_PATTERN, 'Use lowercase letters, numbers, and single hyphens only')

/** Pure formatting helper for turning a free-text name into a slug suggestion. The
 * server never trusts a client-supplied slug just because it looks like this — every
 * submitted slug is still re-validated against {@link SLUG_PATTERN} and checked for
 * uniqueness in the database. */
export function suggestSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
}

export const idSchema = z.string().uuid()

export const PROJECT_VARIANTS = ['premium', 'neutral'] as const
export const EDITABLE_STATUSES = ['draft', 'archived'] as const
export const PROJECT_FAMILIES = ['corporate', 'restaurant', 'real-estate', 'portfolio', 'catalog', 'ecommerce'] as const

/**
 * One shared creation payload shape rather than a discriminated union per family — the
 * handler (api/projects/index.ts) only reads the fields relevant to the chosen
 * `family` when building the starting config, and every field below is either generic
 * (name/slug/location) or optional, so an unused family's fields simply go unread
 * rather than needing their own schema branch here.
 */
export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  businessName: z.string().trim().max(80).optional(),
  slug: slugSchema,
  family: z.enum(PROJECT_FAMILIES).default('corporate'),
  /** Corporate only; ignored for other families. */
  variant: z.enum(PROJECT_VARIANTS).default('neutral'),
  /** Corporate only; ignored for other families. */
  industry: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
})

export const updateProjectMetaSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    businessName: z.string().trim().max(80).nullable().optional(),
    slug: slugSchema.optional(),
    status: z.enum(EDITABLE_STATUSES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No fields to update')

export const listProjectsQuerySchema = z.object({
  status: z.enum(['active', 'archived']).default('active'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})
