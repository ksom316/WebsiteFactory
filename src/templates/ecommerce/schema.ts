import { z } from 'zod'

/**
 * The e-commerce template's configuration contract — a sixth family alongside
 * corporate, restaurant, real-estate, portfolio, and catalog (see
 * src/templates/parseConfig.ts). Unlike the catalog family (a discovery/inquiry
 * site), this family demonstrates the full cart → simulated-checkout journey — but
 * it is a DEMO ONLY: no real payment, no real order, no production backend. See
 * README.md's "E-commerce storefront template family" section for the full
 * rationale and the documented seam for a future real Paystack/Stripe integration.
 *
 * Follows the same never-throws defaulting pattern as the other five families: every
 * field is optional or has a `.default(...)`, risky leaf values `.catch(...)` a safe
 * fallback instead of failing the whole parse, and `family` is a self-describing
 * literal tag so a stored config can be parsed correctly without separately tracking
 * which project it came from.
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
  .object({ label: z.string().min(1).max(32), href })
  .optional()
  .catch(undefined)

const navLinkSchema = z.object({ label: z.string().min(1).max(32), href })
const socialLinkSchema = z.object({ label: z.string().min(1).max(24), href })

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be lowercase letters, numbers, and single hyphens')
  .max(80)
  .optional()

/** Finite, non-negative — never a live/computed price. `.catch(undefined)` so a
 * malformed price degrades to "no price" rather than failing the product. */
const price = z.coerce.number().finite().nonnegative().optional().catch(undefined)

const attributeSchema = z.object({
  label: z.string().min(1).max(40),
  value: z.string().min(1).max(120),
})

/** A named choice dimension (e.g. "Size" -> ["S", "M", "L"]) — cart lines are keyed
 * by product slug + the visitor's chosen option for every variant the product
 * defines, so two different sizes of the same product are two distinct cart lines. */
const variantSchema = z.object({
  name: z.string().min(1).max(40),
  options: z.array(z.string().min(1).max(40)).min(1).max(12),
})

export const STOCK_STATUSES = ['in-stock', 'low-stock', 'made-to-order', 'out-of-stock'] as const

const productSchema = z.object({
  slug,
  name: z.string().min(1).max(100),
  description: z.string().max(800).optional(),
  category: z.string().max(60).optional(),
  price,
  salePrice: price,
  images: z.array(safeImageUrl).max(8).default([]).catch([]),
  imageAlt: z.string().max(140).optional(),
  sku: z.string().max(40).optional(),
  variants: z.array(variantSchema).max(4).default([]).catch([]),
  attributes: z.array(attributeSchema).max(8).default([]).catch([]),
  featured: z.boolean().default(false),
  /**
   * Demonstration-only stock state — never a real inventory system. `quantity`, when
   * set, is the maximum a visitor can add to their demo cart for this product (see
   * cart.ts#getMaxQuantity); `status` drives the label shown on the product card and
   * detail dialog. Both are whatever the project configured, not anything this app
   * tracks, computes, or verifies against a real warehouse.
   */
  stock: z
    .object({
      status: z.enum(STOCK_STATUSES).default('in-stock').catch('in-stock'),
      quantity: z.coerce.number().int().nonnegative().max(100000).optional().catch(undefined),
    })
    .default({ status: 'in-stock' }),
})

const shippingOptionSchema = z.object({
  label: z.string().min(1).max(60),
  description: z.string().max(140).optional(),
  price,
})

export const testimonialSchema = z.object({
  quote: z.string().min(1).max(500),
  author: z.string().min(1).max(80),
  role: z.string().max(100).optional(),
})

export const ecommerceConfigSchema = z.object({
  family: z.literal('ecommerce').default('ecommerce'),

  store: z
    .object({
      name: z.string().min(1).max(80).default('Your Store'),
      tagline: z.string().max(140).optional(),
      description: z.string().max(400).optional(),
    })
    .default({ name: 'Your Store' }),

  logo: z
    .object({ text: z.string().max(40).optional(), imageUrl: safeImageUrl.optional() })
    .default({}),

  brand: z
    .object({
      primaryColor: z
        .string()
        .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color like #1F3B4D')
        .catch('#1f6f54'),
    })
    .default({ primaryColor: '#1f6f54' }),

  nav: z.array(navLinkSchema).max(8).default([]).catch([]),

  hero: z
    .object({
      heading: z.string().min(1).max(140).default('New season, thoughtfully made'),
      subheading: z.string().max(320).optional(),
      imageUrl: safeImageUrl.optional(),
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema,
      promoMessage: z.string().max(140).optional(),
    })
    .default({ heading: 'New season, thoughtfully made' }),

  shop: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
      currency: z.string().max(8).default('USD').catch('USD'),
      noPriceLabel: z.string().max(40).default('Contact for price'),
      products: z.array(productSchema).max(60).default([]).catch([]),
    })
    .default({ products: [], currency: 'USD', noPriceLabel: 'Contact for price' }),

  featured: z
    .object({
      heading: z.string().max(100).optional(),
      intro: z.string().max(320).optional(),
    })
    .default({}),

  about: z
    .object({
      heading: z.string().max(100).optional(),
      body: z.string().max(1200).optional(),
      imageUrl: safeImageUrl.optional(),
    })
    .default({}),

  testimonials: z.array(testimonialSchema).max(6).default([]).catch([]),

  checkout: z
    .object({
      /** Shown throughout checkout, including on the confirmation screen, to keep
       * every claim honest about what this demo actually does. Never editable away
       * entirely — see RestoreSanity note in schema.ts's module comment. */
      demoNotice: z
        .string()
        .max(240)
        .default('Demo checkout — no real payment is taken and no order is submitted to a real business.'),
      shippingOptions: z.array(shippingOptionSchema).max(6).default([
        { label: 'Standard shipping', price: 0 },
      ]),
      confirmationMessage: z
        .string()
        .max(320)
        .default("This is a simulated order preview. In production, this is where a real payment and order confirmation would happen."),
    })
    .default({
      demoNotice: 'Demo checkout — no real payment is taken and no order is submitted to a real business.',
      shippingOptions: [{ label: 'Standard shipping', price: 0 }],
      confirmationMessage: 'This is a simulated order preview. In production, this is where a real payment and order confirmation would happen.',
    }),

  contact: z
    .object({
      email: email.optional(),
      phone: phone.optional(),
      social: z.array(socialLinkSchema).max(6).default([]).catch([]),
    })
    .default({ social: [] }),

  sections: z
    .object({
      shop: z.boolean().default(true),
      featured: z.boolean().default(true),
      about: z.boolean().default(true),
      testimonials: z.boolean().default(true),
    })
    .default({ shop: true, featured: true, about: true, testimonials: true }),

  footer: z
    .object({ text: z.string().max(200).optional(), links: z.array(navLinkSchema).max(6).default([]).catch([]) })
    .default({ links: [] }),

  seo: z
    .object({
      title: z.string().max(70).optional(),
      description: z.string().max(200).optional(),
      socialImageUrl: safeImageUrl.optional(),
    })
    .default({}),
})

export type EcommerceConfig = z.infer<typeof ecommerceConfigSchema>
export type EcommerceProduct = EcommerceConfig['shop']['products'][number]
export type ProductVariant = EcommerceProduct['variants'][number]
export type ShippingOption = EcommerceConfig['checkout']['shippingOptions'][number]

/** A fully-defaulted config, used as the safe fallback when input can't be parsed at all. */
export const DEFAULT_ECOMMERCE_CONFIG: EcommerceConfig = ecommerceConfigSchema.parse({})

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

/**
 * Never throws — mirrors the other five families' parsers. Also applies the same
 * cross-field normalizations the catalog family's parser does (see
 * src/templates/catalog/schema.ts#parseCatalogConfig for the full rationale):
 *   1. Fills in a stable, de-duplicated `slug` for every product.
 *   2. Drops a `salePrice` that isn't strictly lower than `price`.
 */
export function parseEcommerceConfig(input: unknown): EcommerceConfig {
  const result = ecommerceConfigSchema.safeParse(input)
  if (!result.success) return DEFAULT_ECOMMERCE_CONFIG

  const seenSlugs = new Set<string>()
  const products = result.data.shop.products.map((product, index) => {
    let candidate = product.slug || suggestSlug(product.name) || `product-${index + 1}`
    while (seenSlugs.has(candidate)) candidate = `${candidate}-${index + 1}`
    seenSlugs.add(candidate)

    const salePrice =
      product.salePrice !== undefined && product.price !== undefined && product.salePrice >= product.price
        ? undefined
        : product.salePrice

    return { ...product, slug: candidate, salePrice }
  })

  return { ...result.data, shop: { ...result.data.shop, products } }
}
