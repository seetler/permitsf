import { Pool } from "pg"
export interface Database {
  query<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>
}
let pool: Pool | undefined
export function database(): Database {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured")
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
  })
  return {
    query: async <T>(sql: string, values?: unknown[]) => ({
      rows: (await pool!.query(sql, values)).rows as T[],
    }),
  }
}
export async function transaction<T>(work: (db: Database) => Promise<T>) {
  database()
  const client = await pool!.connect()
  try {
    await client.query("BEGIN")
    const value = await work({
      query: async <R>(sql: string, values?: unknown[]) => ({
        rows: (await client.query(sql, values)).rows as R[],
      }),
    })
    await client.query("COMMIT")
    return value
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
