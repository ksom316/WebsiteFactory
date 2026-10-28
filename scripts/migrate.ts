import { config as loadEnv } from 'dotenv'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

loadEnv({ path: '.env.local' })
loadEnv()

const connectionString = process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error(
    'Missing DATABASE_URL (or MIGRATIONS_DATABASE_URL). Set it in .env.local — see .env.example.',
  )
  process.exit(1)
}

const migrationsDir = path.resolve(import.meta.dirname, '..', 'migrations')

async function main() {
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No migration files found in migrations/.')
    return
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `)

    const { rows } = await client.query<{ filename: string }>(
      'select filename from schema_migrations',
    )
    const applied = new Set(rows.map((row) => row.filename))

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip  ${file} (already applied)`)
        continue
      }

      const sqlPath = path.join(migrationsDir, file)
      if (!existsSync(sqlPath)) continue
      const sql = readFileSync(sqlPath, 'utf8')

      console.log(`apply ${file}`)
      await client.query('begin')
      try {
        await client.query(sql)
        await client.query('insert into schema_migrations (filename) values ($1)', [file])
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw error
      }
    }

    console.log('Migrations up to date.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
