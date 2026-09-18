import { createHash } from "node:crypto"
import { database } from "./db"
import { HttpError } from "./http"
const local = new Map<string, { hits: number; expires: number }>()
export async function limitChat(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  const hour = Math.floor(Date.now() / 3600000)
  const key = createHash("sha256").update(`${ip}:${hour}`).digest("hex")
  if (process.env.DATABASE_URL) {
    const row = (
      await database().query<{ hits: number }>(
        `INSERT INTO rate_limits(key,expires_at) VALUES($1,now()+interval '2 hours') ON CONFLICT(key) DO UPDATE SET hits=rate_limits.hits+1 RETURNING hits`,
        [key],
      )
    ).rows[0]
    if (row.hits > 40)
      throw new HttpError(429, "You've reached the chat limit for now. Please try again later.")
  } else {
    if (process.env.NODE_ENV === "production")
      throw new HttpError(503, "Hugo is being prepared. Please try again shortly.")
    for (const [k, v] of local) if (v.expires < Date.now()) local.delete(k)
    const entry = local.get(key) || { hits: 0, expires: Date.now() + 3600000 }
    entry.hits++
    local.set(key, entry)
    if (entry.hits > 40) throw new HttpError(429, "Please try again later.")
  }
}
