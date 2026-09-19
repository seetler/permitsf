import { after } from "next/server"
import { database } from "./db"
import { deliverOutbox, type Mail } from "./outbox"

export async function sendEmail(mail: Mail, fetcher: typeof fetch = fetch) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Email not configured")
  }
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": mail.id,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [mail.recipient],
      subject: mail.subject,
      text: mail.body,
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error("Email delivery failed")
}

// Called only after the mutation commits. Vercel keeps this work alive after the
// response; failed deliveries remain in the durable outbox for the next attempt.
export function scheduleEmailDelivery() {
  if (!process.env.DATABASE_URL || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return
  after(async () => {
    try {
      await deliverOutbox(database(), sendEmail)
    } catch {
      console.error("Background email delivery failed; queued messages will be retried")
    }
  })
}
