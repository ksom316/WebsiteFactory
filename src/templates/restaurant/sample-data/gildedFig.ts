import { parseRestaurantConfig, type RestaurantConfig } from '../schema'

/**
 * Sample profile: a fictional Mediterranean bistro. Used in the showcase to demonstrate
 * the restaurant family's register — warm, editorial, food-forward. All contact
 * details are invented for this sample; they are not a real business or person.
 *
 * Image URLs point at Unsplash's public photo CDN (images.unsplash.com), under the
 * Unsplash License (unsplash.com/license): free for commercial and non-commercial use,
 * modification permitted, no attribution required. Every URL below was verified with a
 * direct HTTPS request in this environment (HTTP 200, `image/jpeg`) before being added
 * here — not merely assumed reachable. Regardless, the template's SafeImage fallback
 * (initials on a soft background) still renders if a URL ever stops resolving, so the
 * layout never depends on these specific photos staying up.
 */
export const gildedFigConfig: RestaurantConfig = parseRestaurantConfig({
  restaurant: {
    name: 'The Gilded Fig',
    tagline: 'Mediterranean plates, shared tables',
    description:
      'A neighborhood bistro built around wood-fired cooking, seasonal produce, and a wine list that favors small growers over big names.',
    location: 'Riverside District',
  },
  logo: { text: 'The Gilded Fig' },
  nav: [
    { label: 'Menu', href: '#menu' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Hours & Location', href: '#hours' },
    { label: 'Reserve', href: '#reserve' },
  ],
  hero: {
    heading: 'Mediterranean plates, shared tables',
    subheading:
      'Wood-fired cooking, seasonal produce, and a wine list built around small growers. Open for dinner Tuesday through Sunday.',
    imageUrl: 'https://images.unsplash.com/photo-1583354608715-177553a4035e?w=1600&q=80',
    primaryCta: { label: 'Reserve a table', href: '#reserve' },
    secondaryCta: { label: 'View menu', href: '#menu' },
  },
  menu: {
    heading: 'From the kitchen',
    intro: 'A short, seasonal menu that changes with what the market has to offer.',
    categories: [
      {
        name: 'To start',
        items: [
          { name: 'Marinated olives & feta', description: 'Citrus, chili, rosemary', price: '$9' },
          { name: 'Grilled flatbread', description: 'Whipped tahini, za\'atar, olive oil', price: '$12' },
          { name: 'Charred octopus', description: 'White bean purée, salsa verde', price: '$18' },
        ],
      },
      {
        name: 'Mains',
        items: [
          { name: 'Wood-fired branzino', description: 'Lemon, capers, fennel', price: '$32' },
          { name: 'Lamb shoulder', description: 'Slow-roasted, pomegranate, mint yogurt', price: '$36' },
          { name: 'Roasted cauliflower', description: 'Tahini, pine nuts, pomegranate molasses', price: '$24' },
        ],
      },
      {
        name: 'Dessert',
        items: [
          { name: 'Fig & honey tart', description: 'Mascarpone, candied walnuts', price: '$11' },
          { name: 'Olive oil cake', description: 'Citrus glaze, crème fraîche', price: '$10' },
        ],
      },
    ],
  },
  gallery: {
    heading: 'A look inside',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1651440204216-548382747b40?w=1200&q=80', caption: 'The dining room' },
      { imageUrl: 'https://images.unsplash.com/photo-1748540459503-19efc015143b?w=1200&q=80', caption: 'Wood-fired branzino' },
      { imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1200&q=80', caption: 'The bar' },
      { imageUrl: 'https://images.unsplash.com/photo-1633760040841-1f708ce95c56?w=1200&q=80', caption: 'Charred octopus' },
      { imageUrl: 'https://images.unsplash.com/photo-1759050475187-674550fa911e?w=1200&q=80', caption: 'The patio' },
      { imageUrl: 'https://images.unsplash.com/photo-1728129386664-1bb3196f1bce?w=1200&q=80', caption: 'Fig & honey tart' },
    ],
  },
  hours: [
    { days: 'Tue–Thu', hours: '5:00pm–10:00pm' },
    { days: 'Fri–Sat', hours: '5:00pm–11:00pm' },
    { days: 'Sun', hours: '5:00pm–9:00pm' },
    { days: 'Mon', hours: 'Closed' },
  ],
  contact: {
    email: 'reservations@gildedfig.example',
    phone: '+1 (503) 555-0148',
    address: '412 Riverside Avenue, Portland, OR 97201',
    // reservationUrl points at https://example.com — the one IANA-reserved domain
    // guaranteed to actually resolve (verified in this environment: HTTP 200) — rather
    // than an invented subdomain like the previous `booking.example.com`, which does not
    // resolve at all and would show a DNS error instead of demonstrating the feature.
    // This keeps the "Book a reservation" CTA genuinely clickable without claiming a real
    // reservation partner exists for this fictional restaurant. No `social` link — a
    // fictional sample has no real Instagram account, and a plausible-looking fake
    // subdomain is just a broken link.
    reservationUrl: 'https://example.com',
    social: [],
  },
  footer: {
    text: '© The Gilded Fig — a fictional sample restaurant shown for demonstration purposes.',
    links: [
      { label: 'Menu', href: '#menu' },
      { label: 'Reserve', href: '#reserve' },
    ],
  },
  seo: {
    title: 'The Gilded Fig — Mediterranean bistro in Portland, OR',
    description: 'Wood-fired Mediterranean cooking and natural wine in the Riverside District, Portland, OR.',
  },
})
