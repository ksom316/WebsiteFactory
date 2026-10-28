-- Phase 9.1: registers the restaurant template family. Forward-only, additive, and
-- idempotent (ON CONFLICT DO NOTHING) — it only inserts a new row into the existing
-- `templates` table (see migrations/0001_init.sql); it does not alter any table's
-- columns, so it carries no risk to existing corporate projects or their data.
--
-- This row exists purely to satisfy projects.template_id's foreign key to templates(id)
-- once a project is created with template_id = 'restaurant' — see
-- src/templates/restaurant/registry.ts and README.md's "Template families" section.
--
-- NOT applied automatically by this phase. `npm run db:migrate` (scripts/migrate.ts)
-- auto-discovers every *.sql file under migrations/ and applies whichever ones aren't
-- yet recorded in its schema_migrations tracking table, so this file will be picked up
-- the next time that command is run manually against the real database — no separate
-- step or file argument is needed, and no other project's migration is re-run.
insert into templates (id, name, description, version, is_active)
values ('restaurant', 'Restaurant', 'Food-and-hospitality website template with menu, hours, and gallery.', '0.1.0', true)
on conflict (id) do nothing;
