-- Phase 9.4: registers the product-catalog template family. Forward-only, additive,
-- and idempotent (ON CONFLICT DO NOTHING) — it only inserts a new row into the
-- existing `templates` table (see migrations/0001_init.sql); it does not alter any
-- table's columns, so it carries no risk to existing corporate, restaurant,
-- real-estate, or portfolio projects or data.
--
-- This row exists purely to satisfy projects.template_id's foreign key to templates(id)
-- once a project is created with template_id = 'catalog' — see
-- src/templates/catalog/registry.ts and README.md's "Template families" section.
--
-- NOT applied automatically by this phase, and NOT applied by this phase at all — the
-- live database was unavailable while this migration was written, so it has only been
-- reviewed and tested against its own SQL text (see 0006_catalog_template.test.ts),
-- never run against any database, live or otherwise. `npm run db:migrate`
-- (scripts/migrate.ts) auto-discovers every *.sql file under migrations/ and applies
-- whichever ones aren't yet recorded in its schema_migrations tracking table, so this
-- file (and the still-unapplied migrations/0003_restaurant_template.sql,
-- migrations/0004_real_estate_template.sql, and migrations/0005_portfolio_template.sql
-- before it) will all be picked up the next time that command is run manually against
-- a reachable database — no separate step or file argument is needed, and no other
-- migration is re-run.
insert into templates (id, name, description, version, is_active)
values ('catalog', 'Catalog', 'Product catalog and retail showcase template with search, filtering, and inquiries.', '0.1.0', true)
on conflict (id) do nothing;
