import { sendEmail } from "@/lib/server/email"
import { timingSafeEqual } from "node:crypto"
import { database } from "@/lib/server/db"
import { deliverOutbox, queueReminders } from "@/lib/server/outbox"
export const maxDuration = 60
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET && `Bearer ${process.env.CRON_SECRET}`
  const received = request.headers.get("authorization") || ""
  if (
    !expected ||
    Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return Response.json({ error: "Email not configured" }, { status: 503 })
  try {
    const db = database()
    await queueReminders(db)
    const result = await deliverOutbox(db, sendEmail)
    return Response.json(result)
  } catch {
    return Response.json({ error: "Job failed" }, { status: 500 })
  }
}
