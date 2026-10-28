import { parseRealEstateConfig, type RealEstateConfig } from '../schema'

/**
 * Sample profile: a fictional residential/commercial agency. Used in the showcase to
 * demonstrate the real-estate family's register — premium, editorial, architectural.
 * All agency, agent, and property details are invented for this sample; they are not a
 * real business, person, or property, and no claim about real property availability
 * should be inferred from it.
 *
 * Image URLs point at Unsplash's public photo CDN (images.unsplash.com), under the
 * Unsplash License (unsplash.com/license): free for commercial and non-commercial use,
 * modification permitted, no attribution required. Every URL below was verified with a
 * direct HTTPS request in this environment (HTTP 200, `image/jpeg`) before being added
 * here. The one empty `images` array (Riverside Commercial Storefront) is intentional —
 * it demonstrates the listings grid's no-image state, not a missing asset. Regardless,
 * the template's SafeImage fallback (initials on a soft gradient) still renders if a
 * URL ever stops resolving, so the layout never depends on these specific photos
 * staying up.
 */
export const meridianRealtyConfig: RealEstateConfig = parseRealEstateConfig({
  agency: {
    name: 'Meridian & Co',
    tagline: 'Considered homes, carefully placed',
    description:
      'An independent residential and commercial agency focused on well-built homes and spaces with real architectural character.',
    location: 'Lakeview District',
  },
  logo: { text: 'Meridian & Co' },
  nav: [
    { label: 'Listings', href: '#listings' },
    { label: 'Our team', href: '#agents' },
    { label: 'Enquire', href: '#inquire' },
  ],
  hero: {
    heading: 'Considered homes, carefully placed',
    subheading:
      'We represent a small number of exceptional properties at a time — each one walked, measured, and written up by someone on our team, not a listing feed.',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=80',
    primaryCta: { label: 'View listings', href: '#listings' },
    secondaryCta: { label: 'Meet the team', href: '#agents' },
  },
  listings: {
    heading: 'Featured listings',
    intro: 'A snapshot of what we currently represent — availability changes, so please enquire for the latest status.',
    properties: [
      {
        title: 'The Birchwood House',
        price: '$1,245,000',
        location: 'Lakeview District',
        propertyType: 'house',
        transactionType: 'sale',
        bedrooms: 4,
        bathrooms: 3,
        area: '2,650 sq ft',
        description:
          'A 1962 mid-century house, carefully restored with its original post-and-beam structure intact. Walnut built-ins throughout, a reconfigured kitchen that opens onto a south-facing garden, and a detached studio.',
        features: ['Original post-and-beam structure', 'Detached studio', 'South-facing garden', 'Restored walnut built-ins'],
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
          'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=1200&q=80',
          'https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=1200&q=80',
        ],
      },
      {
        title: 'Harbor Row Apartments, Unit 4B',
        price: '$2,900 / month',
        location: 'Old Harbor',
        propertyType: 'apartment',
        transactionType: 'rent',
        bedrooms: 2,
        bathrooms: 1,
        area: '980 sq ft',
        description:
          'A converted warehouse unit with 11-foot ceilings and the original iron window frames. Shared roof terrace, in-unit laundry, steps from the harbor market.',
        features: ['11-ft ceilings', 'Original iron windows', 'Shared roof terrace', 'In-unit laundry'],
        images: [
          'https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?w=1200&q=80',
          'https://images.unsplash.com/photo-1724582586458-a51791349977?w=1200&q=80',
        ],
      },
      {
        title: 'Cedar Ridge Townhouse',
        price: '$875,000',
        location: 'Cedar Ridge',
        propertyType: 'townhouse',
        transactionType: 'sale',
        bedrooms: 3,
        bathrooms: 2,
        area: '1,840 sq ft',
        description: 'End-unit townhouse backing onto green space, with a finished lower level and attached two-car garage.',
        features: ['End unit', 'Attached two-car garage', 'Finished lower level', 'Backs onto green space'],
        images: ['https://images.unsplash.com/photo-1771366260867-7e07094579d7?w=1200&q=80'],
      },
      {
        title: 'Riverside Commercial Storefront',
        price: '$4,200 / month',
        location: 'Riverside',
        propertyType: 'commercial',
        transactionType: 'rent',
        area: '1,200 sq ft',
        description: 'Ground-floor retail space on a high-foot-traffic corner, previously a bakery; existing fit-out negotiable.',
        features: ['Corner location', 'Existing kitchen fit-out', 'High foot traffic'],
        images: [],
      },
    ],
  },
  agents: {
    heading: 'Our team',
    team: [
      {
        name: 'Dana Whitfield',
        title: 'Principal Agent',
        photoUrl: 'https://images.unsplash.com/photo-1647580427155-0483906cb9de?w=800&q=80',
        email: 'dana@meridianrealty.example',
        phone: '+1 (503) 555-0171',
      },
      {
        name: 'Priya Nandakumar',
        title: 'Commercial Lead',
        photoUrl: 'https://images.unsplash.com/photo-1763478958776-ebd04b6459ee?w=800&q=80',
        email: 'priya@meridianrealty.example',
        phone: '+1 (503) 555-0188',
      },
    ],
  },
  contact: {
    email: 'hello@meridianrealty.example',
    phone: '+1 (503) 555-0160',
    address: '88 Lakeview Avenue, Portland, OR 97201',
    // inquiryUrl points at https://example.com — the one IANA-reserved domain guaranteed
    // to actually resolve (verified in this environment: HTTP 200) — rather than an
    // invented subdomain like the previous `inquiries.example.com`, which does not
    // resolve at all and would show a DNS error instead of demonstrating the feature.
    // This keeps the "Inquire" CTA section genuinely clickable without claiming a real
    // inquiry service exists for this fictional agency. No `social` link — a fictional
    // sample has no real Instagram account, and a plausible-looking fake subdomain is
    // just a broken link.
    inquiryUrl: 'https://example.com',
    social: [],
  },
  footer: {
    text: '© Meridian & Co — a fictional sample agency shown for demonstration purposes.',
    links: [
      { label: 'Listings', href: '#listings' },
      { label: 'Enquire', href: '#inquire' },
    ],
  },
  seo: {
    title: 'Meridian & Co — Residential & commercial real estate in Portland, OR',
    description: 'An independent real-estate agency representing homes and commercial spaces in Portland, OR.',
  },
})
