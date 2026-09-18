import { loadEnvConfig } from "@next/env"
import { Pool } from "pg"
import { readFile } from "node:fs/promises"
loadEnvConfig(process.cwd())
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before running migrations")
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query(await readFile("db/001_service_cases.sql", "utf8"))
    console.log("Service case schema is ready.")
  } finally {
    await pool.end()
  }
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
