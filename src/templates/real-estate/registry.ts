/**
 * Mirrors src/templates/corporate/registry.ts and src/templates/restaurant/registry.ts.
 * `templates` (see migrations/0004_real_estate_template.sql) identifies this family by
 * a stable id, used as `projects.template_id`. Like restaurant, real-estate has a
 * single design, so there's no variant list here — just the id.
 */
export const REAL_ESTATE_TEMPLATE_ID = 'real-estate'
