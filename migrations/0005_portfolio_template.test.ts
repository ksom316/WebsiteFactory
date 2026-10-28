// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(path.join(import.meta.dirname, '0005_portfolio_template.sql'), 'utf8')

describe('0005_portfolio_template.sql', () => {
  it('registers the portfolio template id', () => {
    expect(sql).toMatch(/insert into templates \(id, name, description, version, is_active\)/)
    expect(sql).toMatch(/values \('portfolio',/)
  })

  it('is idempotent (seeds without duplicating on rerun)', () => {
    expect(sql).toMatch(/on conflict \(id\) do nothing/)
  })

  it('only inserts — never alters, drops, or renames a column or table', () => {
    expect(sql).not.toMatch(/alter table|drop |rename /i)
  })
})
