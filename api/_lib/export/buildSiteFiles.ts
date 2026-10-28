import { strToU8 } from 'fflate'
import type { Project } from '../db/queries/projects.js'
import { parseTemplateConfig, type AnyTemplateConfig } from '../../../src/templates/parseConfig.js'
import {
  CORPORATE_TEMPLATE_FILES,
  RESTAURANT_TEMPLATE_FILES,
  REAL_ESTATE_TEMPLATE_FILES,
  PORTFOLIO_TEMPLATE_FILES,
  CATALOG_TEMPLATE_FILES,
  ECOMMERCE_TEMPLATE_FILES,
} from './templateFiles.generated.js'
import {
  GITIGNORE,
  MAIN_TSX,
  STYLES_CSS,
  TSCONFIG_JSON,
  VITE_CONFIG_TS,
  buildAppTsx,
  buildIndexHtml,
  buildPackageJson,
  buildReadme,
  buildSiteConfigModule,
} from './generateFiles.js'
import { sanitizeFilenameSegment } from './sanitize.js'

export interface BuildSiteFilesInput {
  project: Project
  config: AnyTemplateConfig
  versionNumber: number
}

export interface SiteFiles {
  /** Keyed by path, used verbatim as both ZIP entry paths (Phase 6) and Vercel
   * deployment file paths (Phase 7) — see each caller for why that's safe. */
  files: Record<string, Uint8Array>
  packageName: string
}

/** Which family's bundled template-file manifest to ship — see scripts/buildExportManifest.ts. */
function getTemplateFiles(family: AnyTemplateConfig['family']): Record<string, string> {
  if (family === 'restaurant') return RESTAURANT_TEMPLATE_FILES
  if (family === 'real-estate') return REAL_ESTATE_TEMPLATE_FILES
  if (family === 'portfolio') return PORTFOLIO_TEMPLATE_FILES
  if (family === 'catalog') return CATALOG_TEMPLATE_FILES
  if (family === 'ecommerce') return ECOMMERCE_TEMPLATE_FILES
  return CORPORATE_TEMPLATE_FILES
}

/**
 * Builds the complete standalone website's file set — the single shared
 * implementation behind both ZIP export (buildExportZip.ts) and Vercel deployment
 * (api/_lib/deployment/), for whichever template family the project's config belongs
 * to. Every entry path here is a fixed string literal or derived from the stable,
 * pre-generated template file manifest — project-controlled input (name, slug,
 * business name, config fields) only ever ends up inside file CONTENTS, never in a
 * path, so there is no path-traversal surface regardless of what a project's saved
 * data contains.
 */
export function buildSiteFiles(input: BuildSiteFilesInput): SiteFiles {
  // Defense in depth: re-normalize whatever was stored, even though every save path
  // already does this (see api/_lib/db/queries/projects.ts) — never trust that data
  // read back from storage still matches the current schema.
  const config = parseTemplateConfig(input.config)
  const packageName = sanitizeFilenameSegment(input.project.slug)

  const files: Record<string, Uint8Array> = {}

  for (const [relativePath, content] of Object.entries(getTemplateFiles(config.family))) {
    files[`src/templates/${config.family}/${relativePath}`] = strToU8(content)
  }

  files['package.json'] = strToU8(buildPackageJson(packageName))
  files['index.html'] = strToU8(buildIndexHtml(input.project, config))
  files['vite.config.ts'] = strToU8(VITE_CONFIG_TS)
  files['tsconfig.json'] = strToU8(TSCONFIG_JSON)
  files['.gitignore'] = strToU8(GITIGNORE)
  files['README.md'] = strToU8(buildReadme(input.project, config, input.versionNumber))
  files['src/main.tsx'] = strToU8(MAIN_TSX)
  files['src/App.tsx'] = strToU8(buildAppTsx(config.family))
  files['src/styles.css'] = strToU8(STYLES_CSS)
  files['src/site-config.ts'] = strToU8(buildSiteConfigModule(config))

  return { files, packageName }
}
