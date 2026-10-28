import { getSql, DatabaseError } from '../client.js'

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const sql = getSql()
    await sql`select 1`
    return true
  } catch (error) {
    throw new DatabaseError(error)
  }
}
