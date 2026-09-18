import { randomUUID } from "node:crypto"
import type { Database } from "./db"
import { enqueue } from "./cases"
import { appUrl, notificationEmail } from "./config"
export interface Mail {
  id: string
  recipient: string
  subject: string
  body: string
  attempts: number
  lease_id: string
}
export async function queueReminders(db: Database) {
  const rows = (
    await db.query<{ id: string }>(
      `SELECT id FROM cases WHERE status NOT IN ('completed','cancelled') AND (assignee_id IS NULL OR follow_up_at<now()) LIMIT 100`,
    )
  ).rows
  for (const row of rows)
    await enqueue(
      db,
      `follow-up:${row.id}:${new Date().toISOString().slice(0, 10)}`,
      notificationEmail(),
      "Civic Easy: case needs attention",
      `A case is unassigned or due for follow-up.\n${appUrl()}/operations/${row.id}`,
    )
  await db.query(`DELETE FROM rate_limits WHERE expires_at<now()`)
}
export async function deliverOutbox(db: Database, send: (mail: Mail) => Promise<void>) {
  const lease = randomUUID()
  const rows = (
    await db.query<Mail>(
      `UPDATE outbox SET lease_id=$1,lease_until=now()+interval '5 minutes',attempts=attempts+1 WHERE id IN (SELECT id FROM outbox WHERE sent_at IS NULL AND failed_at IS NULL AND available_at<=now() AND (lease_until IS NULL OR lease_until<now()) ORDER BY created_at LIMIT 5 FOR UPDATE SKIP LOCKED) RETURNING *`,
      [lease],
    )
  ).rows
  let sent = 0,
    failed = 0
  for (const mail of rows) {
    try {
      await send(mail)
      await db.query(
        `UPDATE outbox SET sent_at=now(),lease_until=NULL WHERE id=$1 AND lease_id=$2`,
        [mail.id, lease],
      )
      sent++
    } catch {
      await db.query(
        `UPDATE outbox SET lease_until=NULL,available_at=now()+($3 * interval '1 minute'),failed_at=CASE WHEN attempts>=8 THEN now() ELSE NULL END WHERE id=$1 AND lease_id=$2`,
        [mail.id, lease, Math.min(2 ** mail.attempts, 60)],
      )
      failed++
    }
  }
  return { sent, failed }
}
