export interface TemplateVariantMeta {
  id: 'premium' | 'neutral'
  name: string
  description: string
}

/**
 * The corporate template's design variants. This is intentionally a plain TS registry
 * rather than a database table: `templates` (see migrations/0001_init.sql) already
 * identifies the "corporate" template family by a stable id, and a project's chosen
 * variant is just the `variant` field inside its JSONB config
 * (project_config_versions.config) — no schema change was needed for Phase 3.
 */
export const CORPORATE_VARIANTS: TemplateVariantMeta[] = [
  {
    id: 'premium',
    name: 'Premium Agency / Technology',
    description:
      'Editorial and confident — for technology firms, studios, and consultancies that want to look distinctive.',
  },
  {
    id: 'neutral',
    name: 'Neutral Business',
    description: 'Clean and approachable — a versatile foundation for most small and medium-sized businesses.',
  },
]

export const CORPORATE_TEMPLATE_ID = 'corporate'
