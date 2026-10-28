/**
 * Manual verification helper for Phase 6 (website export) — not part of the automated
 * test suite and not wired into any other npm script. Builds an export ZIP for a
 * fictional project using the same buildExportZip() function the real API endpoint
 * calls, and writes it to disk so it can be extracted and built independently of
 * Website Factory, proving the exported project is genuinely standalone.
 *
 * Usage: npx tsx scripts/exportSample.ts [premium|neutral] <output-path.zip>
 */
import { writeFileSync } from 'node:fs'
import { buildExportZip } from '../api/_lib/export/buildExportZip'
import { parseCorporateConfig } from '../src/templates/corporate/schema'
import type { Project } from '../api/_lib/db/queries/projects'

const variant = process.argv[2] === 'premium' ? 'premium' : 'neutral'
const outputPath = process.argv[3] ?? `./sample-export-${variant}.zip`

const project: Project = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Riverside Landscaping',
  slug: 'riverside-landscaping',
  businessName: 'Riverside Landscaping Co.',
  templateId: 'corporate',
  status: 'draft',
  vercelProjectId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const config = parseCorporateConfig({
  variant,
  business: {
    name: 'Riverside Landscaping Co.',
    shortDescription: 'Full-service landscaping for the Riverside area, since 2012.',
    industry: 'Landscaping',
    location: 'Riverside, CA',
  },
  brand: { primaryColor: '#2F6B3A', secondaryColor: '#C98A3E' },
  hero: {
    heading: 'Yards that make the neighbors ask who did it',
    subheading: 'Design, install, and year-round maintenance for homes and small businesses across Riverside.',
    primaryCta: { label: 'Get a quote', href: '#contact' },
  },
  services: [
    { title: 'Landscape design', description: 'Custom planting plans suited to your yard and climate.' },
    { title: 'Seasonal maintenance', description: 'Mowing, pruning, and cleanup on a schedule that fits you.' },
  ],
  contact: {
    email: 'hello@riversidelandscaping.example',
    phone: '+1 (951) 555-0134',
    address: '482 Orchard Ave, Riverside, CA 92501',
  },
})

const { bytes, filename } = buildExportZip({ project, config, versionNumber: 4 })
writeFileSync(outputPath, bytes)
console.log(`Wrote ${outputPath} (${bytes.byteLength} bytes, intended filename: ${filename})`)
