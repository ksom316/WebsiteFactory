import { getSql, DatabaseError } from '../client.js'

export interface Template {
  id: string
  name: string
  description: string
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TemplateRow {
  id: string
  name: string
  description: string
  version: string
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listTemplates(): Promise<Template[]> {
  try {
    const sql = getSql()
    const rows = (await sql`
      select id, name, description, version, is_active, created_at, updated_at
      from templates
      order by name asc
    `) as TemplateRow[]
    return rows.map(mapTemplate)
  } catch (error) {
    throw new DatabaseError(error)
  }
}
