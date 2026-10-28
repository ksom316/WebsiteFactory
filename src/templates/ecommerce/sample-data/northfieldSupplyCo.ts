import { parseEcommerceConfig, type EcommerceConfig } from '../schema'

/**
 * Sample profile: a fictional outdoor-lifestyle goods brand. Used in the showcase to
 * demonstrate the e-commerce family's full shopping journey — browse, filter, add to
 * cart with variants, and a simulated checkout. The brand, products, prices, stock
 * levels, and testimonials below are all invented for this sample and are not a real
 * business; the testimonials are explicitly labeled "(illustrative example)" so they
 * are never mistaken for real endorsements.
 *
 * Image URLs point at Unsplash's public photo CDN (images.unsplash.com), under the
 * Unsplash License (unsplash.com/license): free for commercial and non-commercial use,
 * modification permitted, no attribution required. Every URL below was verified with a
 * direct HTTPS request in this environment (HTTP 200, `image/jpeg`) before being added
 * here. The Summit Trekking Poles product's empty `images` array is intentional — it
 * demonstrates the no-image, out-of-stock product-card state, not a missing asset.
 * Regardless, the template's SafeImage fallback (initials on a soft gradient) still
 * renders if a URL ever stops resolving, so the layout never depends on these specific
 * photos staying up.
 */
export const northfieldSupplyCoConfig: EcommerceConfig = parseEcommerceConfig({
  store: {
    name: 'Northfield Supply Co.',
    tagline: 'Gear built for long days outside',
    description: 'A small outdoor-goods brand making durable bags, layers, and accessories for everyday adventure.',
  },
  logo: { text: 'Northfield Supply Co.' },
  brand: { primaryColor: '#1f6f54' },
  nav: [
    { label: 'Shop', href: '#shop' },
    { label: 'About', href: '#about' },
  ],
  hero: {
    heading: 'New season, thoughtfully made',
    subheading: 'Durable bags, layers, and accessories designed for long days outside — built to be repaired, not replaced.',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80',
    primaryCta: { label: 'Shop new arrivals', href: '#shop' },
    secondaryCta: { label: 'Our story', href: '#about' },
    promoMessage: 'Free shipping on orders over $75 (demo)',
  },
  shop: {
    heading: 'Shop all',
    intro: 'A small, seasonal lineup — nothing mass-produced.',
    currency: 'USD',
    noPriceLabel: 'Contact for price',
    products: [
      {
        name: 'Trailhead Daypack',
        description: 'A 22-liter daypack in weatherproof recycled canvas, built for day hikes and daily commutes alike.',
        category: 'Bags',
        price: 128,
        images: [
          'https://images.unsplash.com/photo-1763386840769-8484a2a02442?w=1200&q=80',
          'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80',
        ],
        imageAlt: 'Trailhead Daypack in olive canvas',
        sku: 'NSC-BAG-010',
        featured: true,
        variants: [{ name: 'Color', options: ['Olive', 'Charcoal', 'Rust'] }],
        attributes: [
          { label: 'Capacity', value: '22L' },
          { label: 'Material', value: 'Recycled canvas' },
        ],
        stock: { status: 'in-stock', quantity: 40 },
      },
      {
        name: 'Ridge Wool Sweater',
        description: 'A heavyweight merino wool sweater, hand-finished, built to hold up to years of wear.',
        category: 'Layers',
        price: 165,
        salePrice: 139,
        images: ['https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?w=1200&q=80'],
        imageAlt: 'Ridge Wool Sweater in natural wool color',
        sku: 'NSC-LAY-004',
        featured: true,
        variants: [
          { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', options: ['Natural', 'Forest'] },
        ],
        attributes: [{ label: 'Material', value: '100% merino wool' }],
        stock: { status: 'low-stock', quantity: 6 },
      },
      {
        name: 'Camp Enamel Mug',
        description: 'A 12oz enamel mug for camp coffee — the one that outlasts the trip.',
        category: 'Accessories',
        price: 18,
        images: ['https://images.unsplash.com/photo-1605714262316-da2faa04731a?w=1200&q=80'],
        imageAlt: 'Camp Enamel Mug in navy',
        sku: 'NSC-ACC-001',
        stock: { status: 'in-stock' },
      },
      {
        name: 'Fireside Flannel',
        description: 'A heavyweight brushed-cotton flannel shirt, built for cold mornings around the fire.',
        category: 'Layers',
        price: 89,
        images: ['https://images.unsplash.com/photo-1698857494817-d244cb4231a8?w=1200&q=80'],
        imageAlt: 'Fireside Flannel in red plaid',
        sku: 'NSC-LAY-012',
        variants: [{ name: 'Size', options: ['S', 'M', 'L'] }],
        stock: { status: 'made-to-order' },
      },
      {
        name: 'Summit Trekking Poles (Limited Run)',
        description: 'Carbon-fiber trekking poles from a limited production run — once this batch sells, it is gone.',
        category: 'Gear',
        price: 95,
        images: [],
        sku: 'NSC-GEA-007',
        stock: { status: 'out-of-stock' },
      },
    ],
  },
  featured: {
    heading: 'Featured this season',
    intro: "A small edit of what we're most excited about right now.",
  },
  about: {
    heading: 'Our story',
    body:
      "Northfield Supply Co. started in a garage in 2018, making one bag at a time for friends who kept asking where we got ours. We still make small batches, repair what breaks, and would rather sell out of something good than mass-produce something forgettable.",
    imageUrl: 'https://images.unsplash.com/photo-1787240663846-598e1033a919?w=1200&q=80',
  },
  testimonials: [
    {
      quote: "My daypack has been through three winters and still looks (and works) like new.",
      author: 'Priya Shah',
      role: 'Customer (illustrative example)',
    },
    {
      quote: "The wool sweater is the warmest thing I own, and it still looks sharp enough for the office.",
      author: 'Daniel Ortiz',
      role: 'Customer (illustrative example)',
    },
  ],
  checkout: {
    demoNotice: 'Demo checkout — no real payment is taken and no order is submitted to a real business.',
    shippingOptions: [
      { label: 'Standard shipping', description: '5–7 business days', price: 6 },
      { label: 'Express shipping', description: '2–3 business days', price: 16 },
    ],
    confirmationMessage: 'This is a simulated order preview. In production, this is where a real payment and order confirmation would happen.',
  },
  contact: {
    email: 'hello@northfieldsupplyco.example',
    phone: '+1 (406) 555-0133',
    // No `social` links — a fictional sample has no real social account to point to, and
    // a fabricated-but-plausible-looking URL would just be a broken link (an invented
    // `instagram.example.com` subdomain does not resolve at all).
    social: [],
  },
  footer: {
    text: '© Northfield Supply Co. — a fictional sample storefront shown for demonstration purposes.',
    links: [
      { label: 'Shop', href: '#shop' },
      { label: 'About', href: '#about' },
    ],
  },
  seo: {
    title: 'Northfield Supply Co. — Outdoor goods, built to last',
    description: 'Durable bags, layers, and accessories from a small outdoor-goods brand.',
  },
})
