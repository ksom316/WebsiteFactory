import { parseCatalogConfig, type CatalogConfig } from '../schema'

/**
 * Sample profile: a fictional homeware and lifestyle boutique. Used in the showcase
 * to demonstrate the catalog family's register — a polished independent-retailer
 * discovery/inquiry site, not a storefront. The business, products, prices, and
 * contact details below are all invented for this sample and are not a real
 * business.
 *
 * Image URLs point at Unsplash's public photo CDN (images.unsplash.com), under the
 * Unsplash License (unsplash.com/license): free for commercial and non-commercial use,
 * modification permitted, no attribution required. Every URL below was verified with a
 * direct HTTPS request in this environment (HTTP 200, `image/jpeg`) before being added
 * here. The beeswax candles product's empty `images` array is intentional — it
 * demonstrates the no-image product-card state, not a missing asset. Regardless, the
 * template's SafeImage fallback (initials on a soft gradient) still renders if a URL
 * ever stops resolving, so the layout never depends on these specific photos staying
 * up.
 */
export const marlowAndFinchConfig: CatalogConfig = parseCatalogConfig({
  business: {
    name: 'Marlow & Finch',
    tagline: 'Thoughtfully made homeware, chosen one piece at a time',
    description: 'An independent homeware boutique sourcing small-batch ceramics, linens, and considered objects for everyday use.',
    location: 'Hudson, NY',
  },
  logo: { text: 'Marlow & Finch' },
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],
  hero: {
    heading: 'Thoughtfully made, carefully chosen',
    subheading: 'Small-batch ceramics, linens, and considered objects for a home that feels like yours.',
    imageUrl: 'https://images.unsplash.com/photo-1621261027519-a71ac66d5a68?w=1600&q=80',
    primaryCta: { label: 'Browse the shop', href: '#shop' },
    secondaryCta: { label: 'Our story', href: '#about' },
    promoMessage: 'Free local pickup in Hudson, NY this week',
  },
  shop: {
    heading: 'Shop',
    intro: 'A rotating selection — most pieces are made in small batches and may sell out.',
    currency: 'USD',
    noPriceLabel: 'Contact for price',
    products: [
      {
        name: 'Hand-thrown stoneware bowl',
        shortDescription: 'Matte glaze, food-safe, dishwasher safe',
        description:
          'Each bowl is thrown on the wheel in small batches, so glaze and shape vary slightly piece to piece — that variation is the point. Finished in a soft matte glaze.',
        category: 'Ceramics',
        price: 48,
        images: [
          'https://images.unsplash.com/photo-1519916478825-b1d7aef08f54?w=1200&q=80',
          'https://images.unsplash.com/photo-1577576223085-3eb295cd414f?w=1200&q=80',
        ],
        badges: ['New'],
        sku: 'MF-CER-014',
        availability: 'Made to order — ships in 2 weeks',
        attributes: [
          { label: 'Material', value: 'Stoneware' },
          { label: 'Diameter', value: '7 in' },
        ],
      },
      {
        name: 'Linen table runner',
        shortDescription: 'Stonewashed European linen',
        description: 'A generously sized stonewashed linen runner that softens with every wash. Hemmed by hand.',
        category: 'Linens',
        price: 64,
        salePrice: 52,
        images: ['https://images.unsplash.com/photo-1705290304352-4beef0b626b3?w=1200&q=80'],
        badges: ['Sale'],
        sku: 'MF-LIN-002',
        attributes: [
          { label: 'Material', value: '100% European linen' },
          { label: 'Dimensions', value: '14 in × 90 in' },
        ],
      },
      {
        name: 'Carved oak serving board',
        shortDescription: 'One-of-a-kind, live-edge oak',
        category: 'Wood',
        images: ['https://images.unsplash.com/photo-1666013942797-9daa4b8b3b4f?w=1200&q=80'],
        badges: ['Featured', 'Limited'],
        sku: 'MF-WOD-007',
        availability: 'Only 1 available',
        attributes: [{ label: 'Material', value: 'Reclaimed oak' }],
      },
      {
        name: 'Beeswax taper candles (set of 4)',
        shortDescription: 'Unscented, slow-burning',
        category: 'Home',
        price: 28,
        images: [],
        availability: 'In stock',
      },
    ],
  },
  featured: {
    heading: 'Featured this month',
    intro: 'A small edit of what we\'re most excited about right now.',
    productSlugs: ['hand-thrown-stoneware-bowl', 'carved-oak-serving-board'],
  },
  about: {
    heading: 'Our story',
    body:
      'Marlow & Finch started as a market stall in 2019 and grew into a small storefront on Warren Street. We work directly with a handful of makers — mostly within a day\'s drive — and change our selection seasonally rather than chasing trends.',
    imageUrl: 'https://images.unsplash.com/photo-1605217613423-0a61bd725c8a?w=1200&q=80',
    location: '118 Warren Street, Hudson, NY 12534',
    hours: 'Wed–Sun, 11am–6pm',
  },
  contact: {
    email: 'hello@marlowandfinch.example',
    phone: '+1 (518) 555-0142',
    whatsapp: '+1 518 555 0142',
    ctaText: 'Ask about an item, custom orders, or local delivery — we usually reply within a day.',
    // No `website`/`social` links here — a fictional sample has no real external site or
    // social account to point to, and a fabricated-but-plausible-looking URL would just
    // be a broken link (see README.md's asset/link-honesty convention). ContactCta
    // already renders correctly with these omitted, since email/phone/whatsapp cover the
    // section's "has any contact method" check.
    social: [],
  },
  footer: {
    text: '© Marlow & Finch — a fictional sample boutique shown for demonstration purposes.',
    links: [
      { label: 'Shop', href: '#shop' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  seo: {
    title: 'Marlow & Finch — Homeware & lifestyle boutique in Hudson, NY',
    description: 'Small-batch ceramics, linens, and considered objects from an independent homeware boutique in Hudson, NY.',
  },
})
