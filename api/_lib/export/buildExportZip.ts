import { zipSync } from 'fflate'
import { buildSiteFiles, type BuildSiteFilesInput } from './buildSiteFiles.js'

export type ExportInput = BuildSiteFilesInput

export interface ExportResult {
  bytes: Uint8Array
  filename: string
}

/** Builds the downloadable ZIP for a project's saved configuration — a thin wrapper
 * around buildSiteFiles() (the shared file-generation logic also used for Vercel
 * deployment) that just zips the result. See buildSiteFiles.ts for the safety
 * properties (no path traversal, normalized config, etc). */
export function buildExportZip(input: ExportInput): ExportResult {
  const { files, packageName } = buildSiteFiles(input)
  const bytes = zipSync(files, { level: 6 })
  return { bytes, filename: `${packageName}.zip` }
}
