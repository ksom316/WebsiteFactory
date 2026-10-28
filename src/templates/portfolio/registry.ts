/**
 * Mirrors src/templates/{corporate,restaurant,real-estate}/registry.ts. `templates`
 * (see migrations/0005_portfolio_template.sql) identifies this family by a stable id,
 * used as `projects.template_id`. Like restaurant and real-estate, portfolio has a
 * single design, so there's no variant list here — just the id.
 */
export const PORTFOLIO_TEMPLATE_ID = 'portfolio'
