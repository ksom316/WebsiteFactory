// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(path.join(import.meta.dirname, '0001_init.sql'), 'utf8')

describe('0001_init.sql', () => {
  it('constrains project status to known values', () => {
    expect(sql).toMatch(/status in \('draft', 'ready', 'deployed', 'archived'\)/)
  })

  it('constrains deployment status and provider to known values', () => {
    expect(sql).toMatch(/provider in \('vercel'\)/)
    expect(sql).toMatch(/status in \('pending', 'building', 'success', 'failed'\)/)
  })

  it('requires a unique project slug', () => {
    expect(sql).toMatch(/slug text not null unique/)
  })

  it('enforces one version number per project via a composite unique constraint', () => {
    expect(sql).toMatch(/unique \(project_id, version_number\)/)
  })

  it('cascades config versions and deployment records when a project is deleted', () => {
    const matches = sql.match(/references projects\(id\) on delete cascade/g)
    expect(matches?.length).toBe(2)
  })

  it('nulls out a project template reference instead of blocking template deletion', () => {
    expect(sql).toMatch(/references templates\(id\) on delete set null/)
  })

  it('seeds the corporate template without duplicating it on rerun', () => {
    expect(sql).toMatch(/on conflict \(id\) do nothing/)
  })
})
