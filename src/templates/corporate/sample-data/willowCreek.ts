import { parseCorporateConfig, type CorporateConfig } from '../schema'

/**
 * Sample profile: a fictional family dental practice. Used in the showcase to
 * demonstrate the "neutral" variant's register — warm and approachable, grounded in a
 * concrete local-business subject rather than a generic "professional services" pitch.
 *
 * Image URLs point at Unsplash's public photo CDN (images.unsplash.com), under the
 * Unsplash License (unsplash.com/license): free for commercial and non-commercial use,
 * modification permitted, no attribution required. The URL below was verified with a
 * direct HTTPS request in this environment (HTTP 200, `image/jpeg`) before being added
 * here. Regardless, the template's SafeImage fallback (initials on a soft background)
 * still renders if it ever stops resolving, so the layout never depends on this
 * specific photo staying up. `highlights` is intentionally empty for this sample: a
 * case-study showcase doesn't fit a single-location dental practice, and the section
 * renders nothing when empty rather than forcing a fabricated case study.
 */
export const willowCreekConfig: CorporateConfig = parseCorporateConfig({
  variant: 'neutral',
  business: {
    name: 'Willow Creek Dental',
    shortDescription: 'Family dentistry in the heart of Willow Creek, open evenings and Saturdays.',
    industry: 'Dental practice',
    location: 'Willow Creek, OR',
  },
  logo: { text: 'Willow Creek Dental' },
  brand: { primaryColor: '#2f5d54', secondaryColor: '#c98a3e', fontStyle: 'approachable' },
  contact: {
    email: 'hello@willowcreekdental.example',
    phone: '+1 (541) 555-0132',
    address: '220 Maple Street, Willow Creek, OR 97123',
    hours: [
      { days: 'Mon–Thu', hours: '8:00am–6:00pm' },
      { days: 'Fri', hours: '8:00am–3:00pm' },
      { days: 'Sat', hours: '9:00am–1:00pm' },
    ],
  },
  nav: [
    { label: 'Services', href: '#services' },
    { label: 'About', href: '#about' },
    { label: 'Reviews', href: '#testimonials' },
    { label: 'Visit us', href: '#contact' },
  ],
  hero: {
    heading: 'Dentistry that fits around your week, not the other way around',
    subheading:
      'Evening and Saturday appointments, same-week availability for urgent visits, and a team that remembers your name — not just your chart number.',
    primaryCta: { label: 'Book an appointment', href: 'tel:+15415550132' },
    secondaryCta: { label: 'Our services', href: '#services' },
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=80',
  },
  about: {
    heading: 'A neighborhood practice, three generations in',
    body:
      "Willow Creek Dental has been on Maple Street since 1986. Dr. Reyes took over the practice from her father in 2014 and has kept the same promise he made: no surprise bills, no rushed appointments, and a team that treats you like a neighbor — because we usually are one.",
    highlights: ['Open since 1986', '4.9★ from 300+ patients', 'Evening & Saturday hours'],
  },
  services: [
    { title: 'General & preventive care', description: 'Cleanings, exams, and sealants for every age, from first teeth to full dentures.' },
    { title: 'Cosmetic dentistry', description: "Whitening, veneers, and bonding for a smile you're comfortable sharing." },
    { title: 'Emergency visits', description: 'Same-week appointments for chipped teeth, toothaches, and lost fillings.' },
    { title: "Children's dentistry", description: 'A calm, kid-friendly first visit — we go slow and explain everything.' },
  ],
  trust: {
    heading: 'Why neighbors choose us',
    items: [
      { label: 'Years on Maple Street', value: '38' },
      { label: 'Patient rating', value: '4.9 / 5' },
      { label: 'Insurance plans accepted', value: '12+' },
    ],
  },
  testimonials: [
    {
      quote: "Dr. Reyes got my son in the same afternoon he chipped his tooth at school. They were so patient with him — he actually asked to go back.",
      author: 'Marisol Ibarra',
      role: 'Patient since 2019',
    },
    {
      quote: 'First dentist office where I didn’t feel like a number. They explained every cost before doing anything.',
      author: 'Tom Haddad',
      role: 'Patient since 2021',
    },
  ],
  highlights: [],
  contactCta: {
    heading: 'New patients welcome',
    body: 'Call or email to find a time that works — most new patients are seen within a week.',
    cta: { label: 'Call the office', href: 'tel:+15415550132' },
  },
  footer: {
    text: '© Willow Creek Dental — a fictional sample practice shown for demonstration purposes.',
    links: [
      { label: 'Services', href: '#services' },
      { label: 'Visit us', href: '#contact' },
    ],
  },
  seo: {
    title: 'Willow Creek Dental — Family dentistry in Willow Creek, OR',
    description: 'Family dentistry with evening and Saturday hours in Willow Creek, OR.',
  },
})
