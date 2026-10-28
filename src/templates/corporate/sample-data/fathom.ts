import { parseCorporateConfig, type CorporateConfig } from '../schema'

/**
 * Sample profile: a fictional software engineering studio. Used in the factory's
 * template showcase to demonstrate the "premium" variant's intended register —
 * confident and editorial, grounded in a specific, non-generic subject (control
 * systems for marine and logistics operators, not another generic "AI SaaS" pitch.
 *
 * Image URLs point at Unsplash's public photo CDN (images.unsplash.com), under the
 * Unsplash License (unsplash.com/license): free for commercial and non-commercial use,
 * modification permitted, no attribution required. Every URL below was verified with a
 * direct HTTPS request in this environment (HTTP 200, `image/jpeg`) before being added
 * here. Regardless, the template's SafeImage fallback (initials on a soft background)
 * still renders if a URL ever stops resolving, so the layout never depends on these
 * specific photos staying up.
 */
export const fathomConfig: CorporateConfig = parseCorporateConfig({
  variant: 'premium',
  business: {
    name: 'Fathom',
    shortDescription: 'Control systems and data infrastructure for marine and logistics operators.',
    industry: 'Software engineering',
    location: 'Portland, Maine',
  },
  logo: { text: 'Fathom' },
  brand: { primaryColor: '#121826', secondaryColor: '#c08a3e', fontStyle: 'editorial' },
  contact: {
    email: 'hello@fathom.example',
    phone: '+1 (207) 555-0148',
    address: '14 Harborview Pier, Portland, ME 04101',
    hours: [{ days: 'Mon–Fri', hours: '8:00–18:00 ET' }],
  },
  nav: [
    { label: 'Work', href: '#highlights' },
    { label: 'Services', href: '#services' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],
  hero: {
    heading: 'The systems freight and fleet operators run on at 3am',
    subheading:
      "We build the control software, telemetry pipelines, and dispatch tooling that marine and logistics operators can't afford to have fail — and the ones that make them faster when it doesn't.",
    primaryCta: { label: 'Start a project', href: '#contact' },
    secondaryCta: { label: 'See our work', href: '#highlights' },
    imageUrl: 'https://images.unsplash.com/photo-1670121180530-cfcba4438038?w=1600&q=80',
  },
  about: {
    heading: "Engineers who've stood watch",
    body:
      "Fathom was founded by engineers who spent a decade building dispatch and telemetry systems inside logistics and offshore energy companies before going independent. We know the difference between software that looks finished in a demo and software that holds up through a storm, a shift change, and a decade of maintenance.\n\nWe work in small, senior teams, embed with your operations staff, and ship systems built to be run — not just launched.",
    highlights: ['Founded 2016', '40+ systems shipped', 'Average client tenure: 4 years'],
  },
  services: [
    { title: 'Fleet & dispatch software', description: 'Scheduling, routing, and crew systems built around how your operation actually runs.' },
    { title: 'Telemetry & monitoring', description: 'Real-time data pipelines from vessels, vehicles, and equipment — with alerting your team trusts.' },
    { title: 'Legacy system modernization', description: 'Replacing brittle, decades-old control software without stopping operations to do it.' },
    { title: 'Embedded & edge systems', description: 'Firmware and on-device software for equipment with no reliable connection back to shore.' },
  ],
  trust: {
    heading: 'Operating alongside',
    items: [
      { label: 'Offshore energy', value: '3 operators' },
      { label: 'Freight & logistics', value: '11 fleets' },
      { label: 'Port authorities', value: '2 ports' },
    ],
  },
  testimonials: [
    {
      quote:
        "Fathom rebuilt our dispatch system in six months without a single day of downtime. They understood our operation better than some of our own vendors did.",
      author: 'Renata Alves',
      role: 'VP Operations, Calder Maritime',
    },
  ],
  highlights: [
    {
      title: 'Calder Maritime — Fleet telemetry overhaul',
      description: 'Replaced a 15-year-old tracking system across 40 vessels with zero downtime.',
      imageUrl: 'https://images.unsplash.com/photo-1678182451047-196f22a4143e?w=1200&q=80',
    },
    {
      title: 'Portside Freight — Dispatch rebuild',
      description: 'Cut dispatch response time from 40 minutes to under 4.',
      imageUrl: 'https://images.unsplash.com/photo-1670121180583-39ab653a071c?w=1200&q=80',
    },
  ],
  contactCta: {
    heading: "Tell us what's breaking",
    body: "Most engagements start with a conversation about what's slow, fragile, or about to fail. No deck required.",
    cta: { label: 'Email the team', href: 'mailto:hello@fathom.example' },
  },
  footer: {
    text: '© Fathom Systems — a fictional sample company shown for demonstration purposes.',
    links: [
      { label: 'Services', href: '#services' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  seo: {
    title: 'Fathom — Systems for marine & logistics operators',
    description: 'Fathom builds control systems and data infrastructure for marine and logistics operators.',
  },
})
