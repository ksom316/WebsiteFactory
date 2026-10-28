import { parsePortfolioConfig, type PortfolioConfig } from '../schema'

/**
 * Sample profile: a fictional product designer. Used in the showcase to demonstrate
 * the portfolio family's register — editorial, confident, personal. All biography,
 * client, and testimonial content is invented for this sample; it is not a real
 * person, and the testimonials below are illustrative placeholder content, not real
 * endorsements from real people.
 *
 * Image URLs point at Unsplash's public photo CDN (images.unsplash.com), under the
 * Unsplash License (unsplash.com/license): free for commercial and non-commercial use,
 * modification permitted, no attribution required. Every URL below was verified with a
 * direct HTTPS request in this environment (HTTP 200, `image/jpeg`) before being added
 * here — not merely assumed reachable. Regardless, the template's SafeImage fallback
 * (initials on a soft gradient) still renders if a URL ever stops resolving, so the
 * layout never depends on these specific photos staying up.
 */
export const lenaAshfordConfig: PortfolioConfig = parsePortfolioConfig({
  person: {
    name: 'Lena Ashford',
    role: 'Product Designer',
    tagline: 'Design systems and interfaces for teams who care about the details',
    location: 'Based in Toronto, working worldwide',
    availability: 'Available for new projects in Q2',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  },
  logo: { text: 'Lena Ashford' },
  nav: [
    { label: 'Work', href: '#work' },
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Contact', href: '#contact' },
  ],
  hero: {
    heading: 'Interfaces that earn their keep',
    subheading:
      "I'm a product designer who partners with small teams to design, systemize, and ship interfaces — from the first wireframe to a production design system.",
    primaryCta: { label: 'See my work', href: '#work' },
    secondaryCta: { label: 'Get in touch', href: '#contact' },
  },
  about: {
    heading: 'About',
    body:
      "I've spent the last eight years designing for early-stage startups and the teams that scale them — mostly B2B software, a little consumer work on the side. I care most about the unglamorous parts: naming conventions, edge cases, and whether the thing still works when the data is messy. Previously at two Series B startups; before that, a small design studio in Montreal.",
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  },
  work: {
    heading: 'Selected work',
    intro: 'A handful of recent projects — case studies available on request.',
    projects: [
      {
        title: 'Northwind design system',
        description: 'A token-based design system and component library adopted across four product teams.',
        category: 'Design systems',
        date: '2025',
        client: 'Northwind Labs',
        role: 'Lead product designer',
        tools: ['Figma', 'Storybook', 'Design tokens'],
        imageUrl: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800&q=80',
        // No `href` — there's no real case-study page to link to for a fictional
        // project, and Work.tsx already renders a project with no href as a plain,
        // non-interactive card instead of a link to nowhere.
      },
      {
        title: 'Harbor onboarding redesign',
        description: 'Cut time-to-first-value from 12 minutes to under 3 by rethinking the first-run experience.',
        category: 'Product design',
        date: '2024',
        client: 'Harbor',
        role: 'Product designer',
        tools: ['Figma', 'User research'],
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      },
      {
        title: 'Fieldstone brand refresh',
        description: 'Visual identity and marketing site refresh for a climate-tech B2B startup.',
        category: 'Brand',
        date: '2023',
        client: 'Fieldstone',
        role: 'Design lead',
        tools: ['Figma', 'Webflow'],
        imageUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80',
      },
    ],
  },
  skills: {
    heading: 'Skills & services',
    intro: 'What I bring to a project, and the services I offer directly.',
    groups: [
      { name: 'Design', items: ['Product design', 'Design systems', 'Prototyping', 'User research'] },
      { name: 'Tools', items: ['Figma', 'Storybook', 'Webflow', 'Linear'] },
    ],
    services: [
      {
        title: 'Design system audits',
        description: 'A structured review of your existing components, tokens, and gaps — with a prioritized plan to close them.',
        // No `href` — there's no real "learn more" page for a fictional service, and
        // Skills.tsx already omits the link entirely when href is absent.
      },
      {
        title: 'Embedded product design',
        description: 'Part-time or fractional design support embedded in your product team for a fixed engagement.',
      },
    ],
  },
  experience: {
    heading: 'Experience',
    intro: 'A short version — the long version is on LinkedIn.',
    entries: [
      { title: 'Lead Product Designer', organization: 'Northwind Labs', period: '2023 — Present', description: 'Built and scaled the design system now used by four product teams.' },
      { title: 'Product Designer', organization: 'Harbor', period: '2021 — 2023', description: 'Owned onboarding and activation design end to end.' },
      { title: 'Designer', organization: 'Studio Montréal', period: '2018 — 2021', description: 'Brand and web design for early-stage startups.' },
    ],
  },
  testimonials: [
    {
      quote: 'Lena rebuilt our onboarding from scratch and activation went up within the first month. She asks the right uncomfortable questions early.',
      author: 'Priya Chandra',
      role: 'Head of Product, Harbor (illustrative example)',
    },
    {
      quote: 'The design system she built is the first one our engineers have actually wanted to use.',
      author: 'Tomas Reyes',
      role: 'Engineering Lead, Northwind Labs (illustrative example)',
    },
  ],
  contact: {
    email: 'hello@lenaashford.example',
    ctaText: 'Have a project in mind? I usually reply within a day.',
    availability: 'Currently booking for Q2 2026.',
    // bookingUrl points at https://example.com — the one IANA-reserved domain guaranteed
    // to actually resolve (verified in this environment: HTTP 200) — rather than an
    // invented subdomain like the previous `cal.example.com`, which does not resolve at
    // all and would show a DNS error instead of demonstrating the feature. This keeps
    // the "Book a call" CTA genuinely clickable without claiming a real scheduling tool
    // is connected for this fictional person.
    bookingUrl: 'https://example.com',
    social: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/example' },
      { label: 'Dribbble', href: 'https://dribbble.com/example' },
    ],
  },
  footer: {
    text: '© Lena Ashford — a fictional sample portfolio shown for demonstration purposes.',
    links: [
      { label: 'Work', href: '#work' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  seo: {
    title: 'Lena Ashford — Product Designer',
    description: 'Product design and design systems for early-stage startups.',
  },
})
