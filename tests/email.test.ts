import { test } from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { sendEmail } from "../lib/server/email"
import type { Mail } from "../lib/server/outbox"
const mail: Mail = {
  id: "delivery-1",
  recipient: "client@example.com",
  subject: "Request received",
  body: "Your request is ready.",
  attempts: 1,
  lease_id: "lease-1",
}

test("notification delivery uses the existing outbox ID as its provider idempotency key", async () => {
  process.env.RESEND_API_KEY = "test-only-placeholder"
  process.env.EMAIL_FROM = "Civic Easy <test@example.com>"
  const fetcher: typeof fetch = async (input, init) => {
    assert.equal(input, "https://api.resend.com/emails")
    assert.equal(new Headers(init?.headers).get("Idempotency-Key"), mail.id)
    assert.deepEqual(JSON.parse(init!.body as string), {
      from: process.env.EMAIL_FROM,
      to: [mail.recipient],
      subject: mail.subject,
      text: mail.body,
    })
    return new Response("{}", { status: 200 })
  }
  await sendEmail(mail, fetcher)
})
test("provider failures propagate to the outbox retry handler", async () => {
  await assert.rejects(
    sendEmail(mail, async () => new Response("{}", { status: 503 })),
    /delivery failed/,
  )
})
test("Vercel schedule remains compatible with the Hobby daily limit", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"))
  for (const cron of config.crons) {
    const [minute, hour, day, month, weekday] = cron.schedule.split(" ")
    assert.match(minute, /^\d+$/)
    assert.match(hour, /^\d+$/)
    assert.ok(Number(minute) < 60 && Number(hour) < 24)
    assert.deepEqual([day, month, weekday], ["*", "*", "*"])
  }
})
