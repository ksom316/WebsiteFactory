// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(path.join(import.meta.dirname, '0004_real_estate_template.sql'), 'utf8')

describe('0004_real_estate_template.sql', () => {
  it('registers the real-estate template id', () => {
    expect(sql).toMatch(/insert into templates \(id, name, description, version, is_active\)/)
    expect(sql).toMatch(/values \('real-estate',/)
  })

  it('is idempotent (seeds without duplicating on rerun)', () => {
    expect(sql).toMatch(/on conflict \(id\) do nothing/)
  })

  it('only inserts — never alters, drops, or renames a column or table', () => {
    expect(sql).not.toMatch(/alter table|drop |rename /i)
  })
})
