import { randomUUID } from "node:crypto"
import type { Database } from "./db"
import { HttpError } from "./http"
import { appUrl, notificationEmail, staffIds } from "./config"
import { caseStatuses, statusLabels, type CaseStatus } from "../catalog"
export type Actor = { id: string; staff: boolean }
export interface CaseRow {
  id: string
  order_id: string
  user_id: string
  email: string
  service_name: string
  scope: string
  objective: string
  project_address: string
  amount: number
  order_status: string
  status: CaseStatus
  assignee_id: string | null
  next_action: string
  follow_up_at: string | null
  version: number
  created_at: string
  updated_at: string
}
export interface OrderRow {
  id: string
  user_id: string
  email: string
  service_id: string
  service_name: string
  scope: string
  amount: number
  currency: string
  objective: string
  project_address: string
  status: string
  stripe_session_id: string | null
}
export const caseSelect = `SELECT c.*, o.user_id, o.email, o.service_name, o.scope, o.objective, o.project_address, o.amount, o.status AS order_status FROM cases c JOIN orders o ON o.id=c.order_id`
export async function getCase(db: Database, id: string, actor: Actor, lock = false) {
  const row = (
    await db.query<CaseRow>(`${caseSelect} WHERE c.id=$1 ${lock ? "FOR UPDATE OF c" : ""}`, [id])
  ).rows[0]
  if (!row || (!actor.staff && row.user_id !== actor.id))
    throw new HttpError(404, "Request not found.")
  return row
}
export function clientCase(row: CaseRow) {
  const {
    assignee_id: _assignee,
    next_action: _action,
    follow_up_at: _followUp,
    user_id: _user,
    email: _email,
    ...safe
  } = row
  return safe
}
export async function enqueue(
  db: Database,
  key: string,
  recipient: string,
  subject: string,
  body: string,
) {
  await db.query(
    `INSERT INTO outbox(id,dedupe_key,recipient,subject,body) VALUES($1,$2,$3,$4,$5) ON CONFLICT(dedupe_key) DO NOTHING`,
    [randomUUID(), key, recipient, subject, body],
  )
}
export async function addEvent(
  db: Database,
  caseId: string,
  actorId: string,
  kind: string,
  body: string,
  internal = false,
) {
  const id = randomUUID()
  await db.query(
    `INSERT INTO case_events(id,case_id,actor_id,kind,body,internal) VALUES($1,$2,$3,$4,$5,$6)`,
    [id, caseId, actorId, kind, body, internal],
  )
  return id
}
// Called inside a transaction. The order lock serializes repeated/concurrent Stripe deliveries.
export async function fulfillOrder(
  db: Database,
  payment: {
    orderId: string
    sessionId: string
    paymentId: string
    amount: number
    currency: string
    paid: boolean
    userId: string
  },
) {
  if (!payment.paid) return null
  const order = (
    await db.query<OrderRow>(`SELECT * FROM orders WHERE id=$1 FOR UPDATE`, [payment.orderId])
  ).rows[0]
  if (!order) throw new Error("Paid order not found")
  if (
    order.user_id !== payment.userId ||
    order.amount !== payment.amount ||
    order.currency !== payment.currency ||
    (order.stripe_session_id && order.stripe_session_id !== payment.sessionId)
  )
    throw new Error("Payment does not match order")
  const existing = (
    await db.query<{ id: string }>(`SELECT id FROM cases WHERE order_id=$1`, [order.id])
  ).rows[0]
  if (existing) return existing.id
  if (order.status !== "pending") throw new Error("Order is not pending")
  await db.query(
    `UPDATE orders SET status='paid', stripe_session_id=$2, stripe_payment_id=$3 WHERE id=$1`,
    [order.id, payment.sessionId, payment.paymentId],
  )
  const id = randomUUID()
  await db.query(
    `INSERT INTO cases(id,order_id,assignee_id,follow_up_at) VALUES($1,$2,$3,now()+interval '1 day')`,
    [id, order.id, staffIds()[0] || null],
  )
  await addEvent(
    db,
    id,
    "system",
    "status",
    "Your purchase is confirmed. We'll review your project and contact you for anything we need. Government fees are separate.",
  )
  await enqueue(
    db,
    `paid:${order.id}:client`,
    order.email,
    "Civic Easy: we've received your request",
    `Your ${order.service_name} purchase is confirmed. We will review your project and get in touch for the information we need.\n\nView your request: ${appUrl()}/requests/${id}`,
  )
  await enqueue(
    db,
    `paid:${order.id}:team`,
    notificationEmail(),
    "New paid Civic Easy case",
    `A client purchased ${order.service_name}. Review and start the case:\n${appUrl()}/operations/${id}`,
  )
  return id
}
export async function postMessage(
  db: Database,
  id: string,
  actor: Actor,
  body: string,
  kind: "message" | "note" | "request",
) {
  const row = await getCase(db, id, actor, true)
  if (!actor.staff && kind !== "message")
    throw new HttpError(403, "Only staff can add internal notes or information requests.")
  const eventId = await addEvent(db, id, actor.id, kind, body, kind === "note")
  if (kind === "request") {
    if (["completed", "cancelled"].includes(row.status))
      throw new HttpError(409, "Reopen the case before requesting information.")
    await db.query(
      `UPDATE cases SET status='action_needed',version=version+1,updated_at=now() WHERE id=$1`,
      [id],
    )
  } else await db.query(`UPDATE cases SET version=version+1,updated_at=now() WHERE id=$1`, [id])
  if (kind !== "note")
    await enqueue(
      db,
      `message:${eventId}`,
      actor.staff ? row.email : notificationEmail(),
      actor.staff ? "Civic Easy: an update on your request" : "Civic Easy: client replied",
      `There is a new ${kind === "request" ? "information request" : "message"} on your case.\n${appUrl()}/${actor.staff ? "requests" : "operations"}/${id}`,
    )
}
export async function updateCase(
  db: Database,
  id: string,
  actor: Actor,
  change: {
    status: CaseStatus
    assigneeId: string
    nextAction: string
    followUpAt: string | null
    version: number
  },
) {
  if (!actor.staff) throw new HttpError(403, "Staff access required.")
  if (!caseStatuses.includes(change.status)) throw new HttpError(400, "Invalid case status.")
  if (change.assigneeId && !staffIds().includes(change.assigneeId))
    throw new HttpError(400, "Choose a configured staff member.")
  const terminal = ["completed", "cancelled"].includes(change.status)
  if (!terminal && (!change.assigneeId || !change.nextAction.trim() || !change.followUpAt))
    throw new HttpError(400, "Active cases need an owner, next action, and follow-up date.")
  if (change.followUpAt && !Number.isFinite(Date.parse(change.followUpAt)))
    throw new HttpError(400, "Invalid follow-up date.")
  const row = await getCase(db, id, actor, true)
  if (row.version !== change.version)
    throw new HttpError(409, "This case changed. Refresh before saving.")
  await db.query(
    `UPDATE cases SET status=$2,assignee_id=$3,next_action=$4,follow_up_at=$5,version=version+1,updated_at=now() WHERE id=$1`,
    [
      id,
      change.status,
      change.assigneeId || null,
      change.nextAction,
      terminal ? null : change.followUpAt,
    ],
  )
  await addEvent(
    db,
    id,
    actor.id,
    "note",
    `Work plan updated. Owner: ${change.assigneeId || "Unassigned"}. Next action: ${change.nextAction}. Follow-up: ${terminal ? "None" : change.followUpAt}.`,
    true,
  )
  if (row.status !== change.status) {
    const event = await addEvent(db, id, actor.id, "status", statusLabels[change.status])
    await enqueue(
      db,
      `status:${event}`,
      row.email,
      "Civic Easy: your request has an update",
      `Your request is now: ${statusLabels[change.status]}.\n${appUrl()}/requests/${id}`,
    )
  }
}

export async function readCaseDetail(db: Database, id: string, actor: Actor, team = false) {
  const row = await getCase(db, id, actor)
  const internal = actor.staff && team
  const events = (
    await db.query(
      `SELECT id,kind,body,internal,created_at,
    CASE WHEN actor_id=$2 THEN 'You' WHEN actor_id=$3 THEN 'Client' ELSE 'Civic Easy' END AS author
    FROM case_events WHERE case_id=$1 ${internal ? "" : "AND NOT internal"} ORDER BY created_at,id`,
      [id, actor.id, row.user_id],
    )
  ).rows
  const documents = (
    await db.query(
      `SELECT id,name,size,created_at FROM documents WHERE case_id=$1 ORDER BY created_at`,
      [id],
    )
  ).rows
  const applications = (
    await db.query(`SELECT * FROM applications WHERE case_id=$1 ORDER BY updated_at`, [id])
  ).rows
  return { case: internal ? row : clientCase(row), events, documents, applications }
}
export async function getDocument(db: Database, id: string, actor: Actor) {
  const doc = (
    await db.query<{ case_id: string; pathname: string; name: string; content_type: string }>(
      `SELECT * FROM documents WHERE id=$1`,
      [id],
    )
  ).rows[0]
  if (!doc) throw new HttpError(404, "Document not found.")
  await getCase(db, doc.case_id, actor)
  return doc
}
