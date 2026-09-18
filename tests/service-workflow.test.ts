import { after, before, beforeEach, test } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"
import {
  readCaseDetail,
  getDocument,
  fulfillOrder,
  getCase,
  clientCase,
  postMessage,
  updateCase,
} from "../lib/server/cases"
import { deliverOutbox, queueReminders } from "../lib/server/outbox"
import { configuredServices } from "../lib/server/config"
import type { Database } from "../lib/server/db"
let pg: PGlite
const owner = { id: "client-1", staff: false },
  staff = { id: "staff-1", staff: true }
const orderId = randomUUID()
const payment = {
  orderId,
  sessionId: "cs_1",
  paymentId: "pi_1",
  amount: 9900,
  currency: "usd",
  paid: true,
  userId: owner.id,
}
const adapt = (db: { query: (sql: string, values?: unknown[]) => Promise<unknown> }) =>
  db as Database
const tx = <T>(fn: (db: Database) => Promise<T>) => pg.transaction((db) => fn(adapt(db)))
before(async () => {
  process.env.CIVIC_EASY_STAFF_IDS = "staff-1,staff-2"
  process.env.NEXT_PUBLIC_APP_URL = "https://civiceasy.com"
  pg = new PGlite()
  await pg.exec(await readFile("db/001_service_cases.sql", "utf8"))
})
after(async () => {
  await pg.close()
})
beforeEach(async () => {
  await pg.exec(
    "TRUNCATE orders,cases,case_events,applications,documents,outbox,rate_limits CASCADE",
  )
  await pg.query(
    `INSERT INTO orders(id,user_id,email,request_key,service_id,service_name,scope,amount,objective,project_address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      orderId,
      owner.id,
      "client@example.com",
      randomUUID(),
      "home-project",
      "Home project permit support",
      "One permit",
      9900,
      "Kitchen remodel",
      "San Francisco",
    ],
  )
})
test("a paid order creates one assigned case, a timeline entry, and two notifications", async () => {
  const id = await tx((db) => fulfillOrder(db, payment))
  assert.ok(id)
  const row = await getCase(adapt(pg), id, owner)
  assert.equal(row.assignee_id, "staff-1")
  assert.equal(row.status, "received")
  assert.equal(row.amount, 9900)
  assert.ok(row.follow_up_at)
  const mail = (await pg.query<{ recipient: string }>("SELECT recipient FROM outbox")).rows
  assert.deepEqual(
    mail.map((m) => m.recipient).sort(),
    ["client@example.com", "info@evolvedigitallyllc.com"].sort(),
  )
})
test("webhook retries do not duplicate fulfillment or emails", async () => {
  const first = await tx((db) => fulfillOrder(db, payment))
  const again = await tx((db) => fulfillOrder(db, payment))
  assert.equal(first, again)
  assert.equal((await pg.query("SELECT * FROM cases")).rows.length, 1)
  assert.equal((await pg.query("SELECT * FROM outbox")).rows.length, 2)
})
test("unpaid sessions never create a case", async () => {
  assert.equal(await tx((db) => fulfillOrder(db, { ...payment, paid: false })), null)
  assert.equal((await pg.query("SELECT * FROM cases")).rows.length, 0)
})
test("wrong amount, owner, or currency cannot fulfill an order", async () => {
  for (const change of [{ amount: 99 }, { userId: "attacker" }, { currency: "eur" }])
    await assert.rejects(
      tx((db) => fulfillOrder(db, { ...payment, ...change })),
      /does not match/,
    )
  assert.equal((await pg.query("SELECT * FROM cases")).rows.length, 0)
})
test("a different session cannot fulfill an existing checkout", async () => {
  await pg.query("UPDATE orders SET stripe_session_id='cs_original'")
  await assert.rejects(
    tx((db) => fulfillOrder(db, payment)),
    /does not match/,
  )
})
test("fulfillment and email records roll back together on failure", async () => {
  await assert.rejects(
    tx(async (db) => {
      await fulfillOrder(db, payment)
      throw new Error("Simulated database failure")
    }),
  )
  assert.equal((await pg.query("SELECT * FROM cases")).rows.length, 0)
  assert.equal((await pg.query("SELECT * FROM outbox")).rows.length, 0)
  assert.equal(
    (await pg.query<{ status: string }>("SELECT status FROM orders")).rows[0].status,
    "pending",
  )
})
test("customers cannot read other customers' cases; staff can", async () => {
  const id = (await tx((db) => fulfillOrder(db, payment)))!
  await assert.rejects(getCase(adapt(pg), id, { id: "another-client", staff: false }), /not found/)
  assert.equal((await getCase(adapt(pg), id, staff)).id, id)
  const publicRow = clientCase(await getCase(adapt(pg), id, staff))
  assert.equal("next_action" in publicRow, false)
  assert.equal("email" in publicRow, false)
  assert.equal("assignee_id" in publicRow, false)
})
test("internal notes are private and do not send notifications", async () => {
  const id = (await tx((db) => fulfillOrder(db, payment)))!
  await tx((db) => postMessage(db, id, staff, "Internal research", "note"))
  const events = (
    await pg.query<{ internal: boolean }>("SELECT internal FROM case_events WHERE kind='note'")
  ).rows
  assert.equal(events[0].internal, true)
  assert.equal((await pg.query("SELECT * FROM outbox")).rows.length, 2)
  await assert.rejects(
    tx((db) => postMessage(db, id, owner, "Try to add note", "note")),
    /Only staff/,
  )
})
test("information requests change status and client replies notify the team", async () => {
  const id = (await tx((db) => fulfillOrder(db, payment)))!
  await tx((db) => postMessage(db, id, staff, "Please send the floor plan", "request"))
  assert.equal((await getCase(adapt(pg), id, staff)).status, "action_needed")
  await tx((db) => postMessage(db, id, owner, "Here are the dimensions", "message"))
  assert.equal((await pg.query("SELECT * FROM outbox")).rows.length, 4)
})
test("active work requires an owner and follow-up; stale edits are rejected", async () => {
  const id = (await tx((db) => fulfillOrder(db, payment)))!
  const plan = {
    status: "in_progress" as const,
    assigneeId: "staff-2",
    nextAction: "Prepare application",
    followUpAt: new Date(Date.now() + 86400000).toISOString(),
    version: 1,
  }
  await assert.rejects(
    tx((db) => updateCase(db, id, staff, { ...plan, assigneeId: "" })),
    /owner/,
  )
  await assert.rejects(
    tx((db) => updateCase(db, id, staff, { ...plan, assigneeId: "intruder" })),
    /configured/,
  )
  await tx((db) => updateCase(db, id, staff, plan))
  await assert.rejects(
    tx((db) => updateCase(db, id, staff, plan)),
    /changed/,
  )
  await assert.rejects(
    tx((db) => updateCase(db, id, owner, { ...plan, version: 2 })),
    /Staff/,
  )
})
test("completed cases can be reopened and do not accept information requests until then", async () => {
  const id = (await tx((db) => fulfillOrder(db, payment)))!
  await tx((db) =>
    updateCase(db, id, staff, {
      status: "completed",
      assigneeId: "staff-1",
      nextAction: "Delivered",
      followUpAt: null,
      version: 1,
    }),
  )
  await assert.rejects(
    tx((db) => postMessage(db, id, staff, "More details?", "request")),
    /Reopen/,
  )
  assert.equal((await pg.query("SELECT * FROM case_events WHERE kind='request'")).rows.length, 0)
  await tx((db) =>
    updateCase(db, id, staff, {
      status: "in_progress",
      assigneeId: "staff-1",
      nextAction: "Review correction",
      followUpAt: new Date().toISOString(),
      version: 2,
    }),
  )
  assert.equal((await getCase(adapt(pg), id, staff)).status, "in_progress")
})
test("failed email delivery retries without changing paid fulfillment", async () => {
  await tx((db) => fulfillOrder(db, payment))
  const failed = await deliverOutbox(adapt(pg), async () => {
    throw new Error("Provider down")
  })
  assert.equal(failed.failed, 2)
  assert.equal(
    (await pg.query<{ status: string }>("SELECT status FROM orders")).rows[0].status,
    "paid",
  )
  await pg.query("UPDATE outbox SET available_at=now()")
  const sent = await deliverOutbox(adapt(pg), async () => {})
  assert.equal(sent.sent, 2)
  assert.equal(
    (
      await deliverOutbox(adapt(pg), async () => {
        assert.fail("must not resend")
      })
    ).sent,
    0,
  )
})
test("overdue reminders are deduplicated per day", async () => {
  await tx((db) => fulfillOrder(db, payment))
  await pg.query("UPDATE cases SET follow_up_at=now()-interval '1 day'")
  await queueReminders(adapt(pg))
  await queueReminders(adapt(pg))
  assert.equal(
    (await pg.query("SELECT * FROM outbox WHERE dedupe_key LIKE 'follow-up:%'")).rows.length,
    1,
  )
})
test("catalog defaults to $99 per permit and missing setup disables payment", () => {
  delete process.env.DATABASE_URL
  for (const s of configuredServices()) {
    assert.equal(s.amount, 9900)
    assert.equal(s.available, false)
  }
})

test("client detail excludes internal notes even if team view is requested", async () => {
  const id = (await tx((db) => fulfillOrder(db, payment)))!
  await tx((db) => postMessage(db, id, staff, "Internal-only content", "note"))
  const client = await readCaseDetail(adapt(pg), id, owner, true)
  assert.equal(
    client.events.some((e) => e.internal),
    false,
  )
  assert.equal(JSON.stringify(client).includes("Internal-only content"), false)
  const team = await readCaseDetail(adapt(pg), id, staff, true)
  assert.equal(
    team.events.some((e) => e.body === "Internal-only content"),
    true,
  )
})
test("document access checks the parent case owner, and client listings never expose storage paths", async () => {
  const id = (await tx((db) => fulfillOrder(db, payment)))!
  const docId = randomUUID()
  await pg.query(
    `INSERT INTO documents(id,case_id,uploader_id,name,pathname,content_type,size) VALUES($1,$2,$3,'plan.pdf','private/path','application/pdf',100)`,
    [docId, id, owner.id],
  )
  await assert.rejects(
    getDocument(adapt(pg), docId, { id: "other-client", staff: false }),
    /not found/,
  )
  assert.equal((await getDocument(adapt(pg), docId, owner)).name, "plan.pdf")
  assert.equal((await getDocument(adapt(pg), docId, staff)).name, "plan.pdf")
  const detail = await readCaseDetail(adapt(pg), id, owner)
  assert.equal("pathname" in detail.documents[0], false)
})
test("email exhaustion leaves a visible failed record rather than retrying forever", async () => {
  await tx((db) => fulfillOrder(db, payment))
  await pg.query("UPDATE outbox SET attempts=7")
  await deliverOutbox(adapt(pg), async () => {
    throw new Error("Provider down")
  })
  const rows = (await pg.query<{ failed_at: string | null }>("SELECT failed_at FROM outbox")).rows
  assert.ok(rows.every((r) => r.failed_at))
  assert.equal(
    (await deliverOutbox(adapt(pg), async () => assert.fail("dead letters must not send"))).sent,
    0,
  )
})
