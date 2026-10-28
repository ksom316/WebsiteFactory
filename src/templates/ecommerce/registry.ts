/**
 * Mirrors src/templates/{corporate,restaurant,real-estate,portfolio,catalog}/registry.ts.
 * `templates` (see migrations/0007_ecommerce_template.sql) identifies this family by a
 * stable id, used as `projects.template_id`. Like restaurant/real-estate/portfolio/
 * catalog, ecommerce has a single design, so there's no variant list here — just the id.
 */
export const ECOMMERCE_TEMPLATE_ID = 'ecommerce'
