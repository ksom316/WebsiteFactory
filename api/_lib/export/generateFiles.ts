import type { Project } from '../db/queries/projects.js'
import type { AnyTemplateConfig } from '../../../src/templates/parseConfig.js'
import { escapeHtml } from './sanitize.js'

/**
 * Dependency versions deliberately pinned to match what this factory itself currently
 * uses (see package.json) — not wildcards, and not blindly copied from the factory's
 * full dependency list, since the exported site only needs React + Vite + Tailwind,
 * none of the factory's server/database/auth packages.
 */
const DEPENDENCY_VERSIONS = {
  react: '^19.3.1',
  reactDom: '^19.3.1',
  vite: '^8.3.4',
  vitePluginReact: '^6.1.2',
  typescript: '~6.0.3',
  tailwindcss: '^4.3.3',
  tailwindVite: '^4.3.3',
  typesReact: '^19.3.0',
  typesReactDom: '^19.3.0',
  zod: '^4.6.7',
}

export function buildPackageJson(packageName: string): string {
  const pkg = {
    name: packageName,
    private: true,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: DEPENDENCY_VERSIONS.react,
      'react-dom': DEPENDENCY_VERSIONS.reactDom,
      zod: DEPENDENCY_VERSIONS.zod,
    },
    devDependencies: {
      '@tailwindcss/vite': DEPENDENCY_VERSIONS.tailwindVite,
      '@types/react': DEPENDENCY_VERSIONS.typesReact,
      '@types/react-dom': DEPENDENCY_VERSIONS.typesReactDom,
      '@vitejs/plugin-react': DEPENDENCY_VERSIONS.vitePluginReact,
      tailwindcss: DEPENDENCY_VERSIONS.tailwindcss,
      typescript: DEPENDENCY_VERSIONS.typescript,
      vite: DEPENDENCY_VERSIONS.vite,
    },
  }
  return JSON.stringify(pkg, null, 2) + '\n'
}

function getConfigTitle(config: AnyTemplateConfig): string {
  if (config.family === 'restaurant') return config.seo.title || config.restaurant.name
  if (config.family === 'real-estate') return config.seo.title || config.agency.name
  if (config.family === 'portfolio') return config.seo.title || config.person.name
  if (config.family === 'catalog') return config.seo.title || config.business.name
  if (config.family === 'ecommerce') return config.seo.title || config.store.name
  return config.seo.title || config.business.name
}

function getConfigDescription(config: AnyTemplateConfig): string {
  if (config.family === 'restaurant') return config.seo.description || config.restaurant.description || ''
  if (config.family === 'real-estate') return config.seo.description || config.agency.description || ''
  if (config.family === 'portfolio') return config.seo.description || config.hero.subheading || ''
  if (config.family === 'catalog') return config.seo.description || config.business.description || ''
  if (config.family === 'ecommerce') return config.seo.description || config.store.description || ''
  return config.seo.description || config.business.shortDescription || ''
}

/**
 * Google Fonts covering every family + variant's display/body faces, all bundled in one
 * request regardless of which family this export is for — any family's CSS might
 * reference any of these, and if the request fails (offline, blocked network), every
 * template already falls back to a system font stack (see each family's tokens.css), so
 * the layout never breaks, just the exact typeface.
 */
const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500;0,9..144,340&family=Archivo:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600;700&family=Spectral:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap'

export function buildIndexHtml(project: Project, config: AnyTemplateConfig): string {
  const title = escapeHtml(getConfigTitle(config) || project.name)
  const description = getConfigDescription(config)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${description ? `<meta name="description" content="${escapeHtml(description)}" />\n    ` : ''}<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="${GOOGLE_FONTS_HREF}" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
}

export const MAIN_TSX = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

/** The exported App.tsx renders only the one family this project uses — it imports
 * that family's own renderer directly rather than the factory's `AnyTemplate`
 * dispatcher, since a standalone export never needs to decide between families. */
export function buildAppTsx(family: AnyTemplateConfig['family']): string {
  if (family === 'restaurant') {
    return `import { RestaurantTemplate } from './templates/restaurant/RestaurantTemplate'
import { siteConfig } from './site-config'

export default function App() {
  return <RestaurantTemplate config={siteConfig} />
}
`
  }

  if (family === 'real-estate') {
    return `import { RealEstateTemplate } from './templates/real-estate/RealEstateTemplate'
import { siteConfig } from './site-config'

export default function App() {
  return <RealEstateTemplate config={siteConfig} />
}
`
  }

  if (family === 'portfolio') {
    return `import { PortfolioTemplate } from './templates/portfolio/PortfolioTemplate'
import { siteConfig } from './site-config'

export default function App() {
  return <PortfolioTemplate config={siteConfig} />
}
`
  }

  if (family === 'catalog') {
    return `import { CatalogTemplate } from './templates/catalog/CatalogTemplate'
import { siteConfig } from './site-config'

export default function App() {
  return <CatalogTemplate config={siteConfig} />
}
`
  }

  if (family === 'ecommerce') {
    return `import { EcommerceTemplate } from './templates/ecommerce/EcommerceTemplate'
import { siteConfig } from './site-config'

export default function App() {
  return <EcommerceTemplate config={siteConfig} />
}
`
  }

  return `import { CorporateTemplate } from './templates/corporate/CorporateTemplate'
import { siteConfig } from './site-config'

export default function App() {
  return <CorporateTemplate config={siteConfig} />
}
`
}

export const STYLES_CSS = `@import 'tailwindcss';

/* Each template variant's own tokens.css (under src/templates/corporate/variants)
   already sets every color, font, and focus style this site needs - this file only
   resets the page's default margin. */
body {
  margin: 0;
}
`

export const VITE_CONFIG_TS = `import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
`

export const TSCONFIG_JSON = `{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "vite.config.ts"]
}
`

export const GITIGNORE = `node_modules
dist
dist-ssr
*.local
`

/**
 * Embeds the saved configuration as a plain JSON literal assigned to a typed constant
 * — never interpolated into a template string or executed. `JSON.stringify` already
 * escapes quotes, backslashes, and all Unicode correctly for a JS/TS string/object
 * literal, and the generator re-runs the family's own parse function at the site's own
 * startup too (belt and suspenders) so a corrupted or unexpected value still normalizes
 * safely instead of crashing the rendered page.
 */
export function buildSiteConfigModule(config: AnyTemplateConfig): string {
  if (config.family === 'restaurant') {
    return `import { parseRestaurantConfig, type RestaurantConfig } from './templates/restaurant/schema'

// This project's saved configuration, exported from Website Factory. Edit the values
// below directly, or re-export after making changes in the factory.
const savedConfig: unknown = ${JSON.stringify(config, null, 2)}

export const siteConfig: RestaurantConfig = parseRestaurantConfig(savedConfig)
`
  }

  if (config.family === 'real-estate') {
    return `import { parseRealEstateConfig, type RealEstateConfig } from './templates/real-estate/schema'

// This project's saved configuration, exported from Website Factory. Edit the values
// below directly, or re-export after making changes in the factory.
const savedConfig: unknown = ${JSON.stringify(config, null, 2)}

export const siteConfig: RealEstateConfig = parseRealEstateConfig(savedConfig)
`
  }

  if (config.family === 'portfolio') {
    return `import { parsePortfolioConfig, type PortfolioConfig } from './templates/portfolio/schema'

// This project's saved configuration, exported from Website Factory. Edit the values
// below directly, or re-export after making changes in the factory.
const savedConfig: unknown = ${JSON.stringify(config, null, 2)}

export const siteConfig: PortfolioConfig = parsePortfolioConfig(savedConfig)
`
  }

  if (config.family === 'catalog') {
    return `import { parseCatalogConfig, type CatalogConfig } from './templates/catalog/schema'

// This project's saved configuration, exported from Website Factory. Edit the values
// below directly, or re-export after making changes in the factory.
const savedConfig: unknown = ${JSON.stringify(config, null, 2)}

export const siteConfig: CatalogConfig = parseCatalogConfig(savedConfig)
`
  }

  if (config.family === 'ecommerce') {
    return `import { parseEcommerceConfig, type EcommerceConfig } from './templates/ecommerce/schema'

// This project's saved configuration, exported from Website Factory. Edit the values
// below directly, or re-export after making changes in the factory.
const savedConfig: unknown = ${JSON.stringify(config, null, 2)}

export const siteConfig: EcommerceConfig = parseEcommerceConfig(savedConfig)
`
  }

  return `import { parseCorporateConfig, type CorporateConfig } from './templates/corporate/schema'

// This project's saved configuration, exported from Website Factory. Edit the values
// below directly, or re-export after making changes in the factory.
const savedConfig: unknown = ${JSON.stringify(config, null, 2)}

export const siteConfig: CorporateConfig = parseCorporateConfig(savedConfig)
`
}

const VARIANT_LABELS: Record<'premium' | 'neutral', string> = {
  premium: 'Premium Agency / Technology',
  neutral: 'Neutral Business',
}

function getTemplateLabelForReadme(config: AnyTemplateConfig): string {
  if (config.family === 'restaurant') return 'Restaurant'
  if (config.family === 'real-estate') return 'Real Estate'
  if (config.family === 'portfolio') return 'Portfolio'
  if (config.family === 'catalog') return 'Catalog'
  if (config.family === 'ecommerce') return 'E-commerce (demo)'
  return VARIANT_LABELS[config.variant]
}

function hasExternalImages(config: AnyTemplateConfig): boolean {
  if (config.family === 'restaurant') {
    return Boolean(
      config.logo.imageUrl ||
        config.hero.imageUrl ||
        config.seo.socialImageUrl ||
        config.gallery.images.some((image) => image.imageUrl),
    )
  }
  if (config.family === 'real-estate') {
    return Boolean(
      config.logo.imageUrl ||
        config.hero.imageUrl ||
        config.seo.socialImageUrl ||
        config.listings.properties.some((property) => property.images.length > 0) ||
        config.agents.team.some((agent) => agent.photoUrl),
    )
  }
  if (config.family === 'portfolio') {
    return Boolean(
      config.logo.imageUrl ||
        config.person.photoUrl ||
        config.about.imageUrl ||
        config.seo.socialImageUrl ||
        config.work.projects.some((project) => project.imageUrl),
    )
  }
  if (config.family === 'catalog') {
    return Boolean(
      config.logo.imageUrl ||
        config.hero.imageUrl ||
        config.about.imageUrl ||
        config.seo.socialImageUrl ||
        config.shop.products.some((product) => product.images.length > 0),
    )
  }
  if (config.family === 'ecommerce') {
    return Boolean(
      config.logo.imageUrl ||
        config.hero.imageUrl ||
        config.about.imageUrl ||
        config.seo.socialImageUrl ||
        config.shop.products.some((product) => product.images.length > 0),
    )
  }
  return Boolean(
    config.logo.imageUrl || config.hero.imageUrl || config.seo.socialImageUrl || config.highlights.some((h) => h.imageUrl),
  )
}

function getSiteName(config: AnyTemplateConfig, fallback: string): string {
  if (config.family === 'restaurant') return config.restaurant.name || fallback
  if (config.family === 'real-estate') return config.agency.name || fallback
  if (config.family === 'portfolio') return config.person.name || fallback
  if (config.family === 'catalog') return config.business.name || fallback
  if (config.family === 'ecommerce') return config.store.name || fallback
  return config.business.name || fallback
}

export function buildReadme(project: Project, config: AnyTemplateConfig, versionNumber: number): string {
  const siteName = getSiteName(config, project.name)
  const variantLabel = getTemplateLabelForReadme(config)
  const templateDirName = config.family
  const externalImages = hasExternalImages(config)
  const isEcommerceDemo = config.family === 'ecommerce'

  return `# ${siteName}

A standalone website exported from Website Factory. This is version ${versionNumber} of
"${project.name}" (template: **${variantLabel}**), saved on ${new Date().toISOString().slice(0, 10)}.

This project has no dependency on Website Factory at runtime — no database, no
authentication, no factory API calls. It's a normal Vite + React + TypeScript site you
can build and host anywhere that serves static files.
${
  isEcommerceDemo
    ? `
## This is a demo storefront — read before using it for anything real

The cart and checkout in this site are **client-side demonstration behavior only**:

- Prices, totals, and stock levels are whatever was configured — nothing here is a
  real inventory system, and no calculation here is authoritative for a real sale.
- The cart persists to the visitor's own browser storage only; it is never sent
  anywhere, and no order is ever created on a server (there is no server).
- Checkout shows Paystack and Stripe as **planned, unavailable** payment options —
  neither SDK is loaded, no payment session is created, and no card/bank/mobile-money
  details are ever collected. The only completable path is an explicitly labeled
  "demo checkout," which never claims a payment succeeded or a real order was placed.
- Checkout contact/address input lives only in memory for the duration of the
  checkout flow and is discarded (never stored, never sent) when it's cancelled or
  completed.

Before this could accept real orders, it would need (at minimum): server-side price
and stock validation, persisted orders, a real Paystack/Stripe integration with
signature-verified webhooks and idempotent payment handling, and secure server-side
handling of customer data — none of which exists in this export.
`
    : ''
}
## Prerequisites

- Node.js 20 or newer
- npm (or another Node package manager of your choice)

## Getting started

1. Extract this ZIP to a folder.
2. Install dependencies:

   \`\`\`bash
   npm install
   \`\`\`

3. Run it locally:

   \`\`\`bash
   npm run dev
   \`\`\`

   Open the URL it prints (typically http://localhost:5173).

## Building for production

\`\`\`bash
npm run build      # outputs static files to dist/
npm run preview    # serves that dist/ build locally so you can check it before deploying
\`\`\`

## Editing content

- **Site content and settings**: edit \`src/site-config.ts\` directly — it's a plain
  TypeScript object matching the same configuration shape Website Factory's project
  editor uses (business info, brand colors, hero content, services, contact details,
  section visibility, SEO, and more).
- **Design**: the actual page layout and styling lives in
  \`src/templates/${templateDirName}/${config.family === 'corporate' ? `variants/${config.variant}/` : ''}\`. This is
  the same rendering code Website Factory itself uses for the ${variantLabel} design.
${
  externalImages
    ? `
## Externally hosted images

This site references at least one image by URL rather than a locally packaged file
(logo, hero image, a highlight's image, or the social preview image). Those URLs are
not fetched or bundled by this export — the page links to them directly, so:

- If the URL stays reachable, the image displays normally.
- If it ever goes offline or is removed, the page does not break: the template falls
  back to a plain placeholder (initials on a soft background) instead of a broken
  image icon.

To replace an image, open \`src/site-config.ts\` and change the relevant \`imageUrl\`
field to a new \`https://\` URL, or to a file you've added under \`public/\` (e.g.
\`/logo.png\` after placing \`logo.png\` in the \`public/\` folder).
`
    : ''
}
## Deploying

Any static host works, since \`npm run build\` produces a plain \`dist/\` folder of
HTML/CSS/JS with no server-side requirements:

- **Vercel**: import this folder as a new project (unrelated to the Website Factory
  deployment) — it auto-detects Vite. No environment variables are required.
- **Netlify, GitHub Pages, Cloudflare Pages, or any static file host**: build with
  \`npm run build\` and upload the contents of \`dist/\`.

## Limitations

- Fonts are loaded from Google Fonts over the network (see \`index.html\`). If that
  request fails, every section already falls back to a system font stack, so the
  layout and readability are unaffected — only the exact typeface changes.
- This is a snapshot of one saved version. Re-export from Website Factory after making
  further changes there; edits made directly to these files are not synced back.
`
}
