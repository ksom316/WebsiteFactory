-- Phase 9.2: registers the real-estate template family. Forward-only, additive, and
-- idempotent (ON CONFLICT DO NOTHING) — it only inserts a new row into the existing
-- `templates` table (see migrations/0001_init.sql); it does not alter any table's
-- columns, so it carries no risk to existing corporate or restaurant projects or data.
--
-- This row exists purely to satisfy projects.template_id's foreign key to templates(id)
-- once a project is created with template_id = 'real-estate' — see
-- src/templates/real-estate/registry.ts and README.md's "Template families" section.
--
-- NOT applied automatically by this phase, and NOT applied by this phase at all — the
-- live database was unavailable while this migration was written, so it has only been
-- reviewed and tested against its own SQL text (see 0004_real_estate_template.test.ts),
-- never run against any database, live or otherwise. `npm run db:migrate`
-- (scripts/migrate.ts) auto-discovers every *.sql file under migrations/ and applies
-- whichever ones aren't yet recorded in its schema_migrations tracking table, so this
-- file (and the still-unapplied migrations/0003_restaurant_template.sql before it) will
-- both be picked up the next time that command is run manually against a reachable
-- database — no separate step or file argument is needed, and no other migration is
-- re-run.
insert into templates (id, name, description, version, is_active)
values ('real-estate', 'Real Estate', 'Real-estate agency website template with listings, agent profiles, and enquiries.', '0.1.0', true)
on conflict (id) do nothing;
