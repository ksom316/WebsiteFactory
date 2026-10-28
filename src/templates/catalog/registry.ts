/**
 * Mirrors src/templates/{corporate,restaurant,real-estate,portfolio}/registry.ts.
 * `templates` (see migrations/0006_catalog_template.sql) identifies this family by a
 * stable id, used as `projects.template_id`. Like restaurant/real-estate/portfolio,
 * catalog has a single design, so there's no variant list here — just the id.
 */
export const CATALOG_TEMPLATE_ID = 'catalog'
