// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(path.join(import.meta.dirname, '0002_deployments.sql'), 'utf8')

describe('0002_deployments.sql', () => {
  it('only adds columns idempotently (every statement is IF NOT EXISTS)', () => {
    const addColumnStatements = sql.match(/add column[^;]+;/g) ?? []
    expect(addColumnStatements.length).toBeGreaterThan(0)
    for (const statement of addColumnStatements) {
      expect(statement).toMatch(/add column if not exists/)
    }
  })

  it('links a project to its Vercel project id', () => {
    expect(sql).toMatch(/alter table projects\s+add column if not exists vercel_project_id text;/)
  })

  it('constrains deployment environment to known values, defaulting to preview', () => {
    expect(sql).toMatch(/environment text not null default 'preview' check \(environment in \('preview', 'production'\)\)/)
  })

  it('links a deployment record to the config version it deployed, without blocking version history', () => {
    expect(sql).toMatch(/config_version_id uuid references project_config_versions\(id\) on delete set null/)
  })

  it('indexes the new config_version_id column it adds', () => {
    expect(sql).toMatch(/create index if not exists idx_deployment_records_config_version_id on deployment_records\(config_version_id\)/)
  })

  it('never drops, renames, or rewrites an existing column (forward-only)', () => {
    expect(sql).not.toMatch(/drop column|rename column|alter column/)
  })
})
