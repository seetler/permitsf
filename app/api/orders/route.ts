import { currentUser } from "@clerk/nextjs/server"
import { randomUUID } from "node:crypto"
import Stripe from "stripe"
import { actor, errorResponse, HttpError, jsonBody, textField, uuid } from "@/lib/server/http"
import { appUrl, configuredServices } from "@/lib/server/config"
import { database } from "@/lib/server/db"
import type { OrderRow } from "@/lib/server/cases"
export async function POST(request: Request) {
  try {
    const user = await actor()
    const body = await jsonBody(request)
    const key = uuid(body.requestKey)
    const objective = textField(body.objective, "project description", 4000, 10)
    const address = textField(body.projectAddress, "San Francisco project location", 500, 3)
    if (body.accepted !== true)
      throw new HttpError(400, "Please review and accept the service scope.")
    const service = configuredServices().find((s) => s.id === body.serviceId)
    if (!service || !service.available || service.amount === null)
      throw new HttpError(503, "Online checkout is not available yet. Please check back shortly.")
    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress
    if (!email || email.verification?.status !== "verified")
      throw new HttpError(400, "Please verify your account email before purchasing.")
    const db = database()
    const recent = (
      await db.query<{ count: string }>(
        `SELECT count(*) FROM orders WHERE user_id=$1 AND created_at>now()-interval '1 hour'`,
        [user.id],
      )
    ).rows[0]
    if (Number(recent.count) >= 20)
      throw new HttpError(429, "Please wait before starting another checkout.")
    await db.query(
      `INSERT INTO orders(id,user_id,email,request_key,service_id,service_name,scope,amount,objective,project_address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(user_id,request_key) DO NOTHING`,
      [
        randomUUID(),
        user.id,
        email.emailAddress,
        key,
        service.id,
        service.name,
        service.scope,
        service.amount,
        objective,
        address,
      ],
    )
    const order = (
      await db.query<OrderRow>(`SELECT * FROM orders WHERE user_id=$1 AND request_key=$2`, [
        user.id,
        key,
      ])
    ).rows[0]
    if (
      order.objective !== objective ||
      order.project_address !== address ||
      order.service_id !== service.id
    )
      throw new HttpError(409, "Your draft changed. Please review it and try again.")
    if (order.status !== "pending")
      return Response.json({ url: `${appUrl()}/requests?order=${order.id}` })
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    let session: Stripe.Checkout.Session
    if (order.stripe_session_id) {
      session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
      if (session.status === "complete")
        return Response.json({ url: `${appUrl()}/requests?order=${order.id}` })
      if (session.status === "expired")
        throw new HttpError(409, "This checkout expired. Please try again to start a new checkout.")
    } else {
      session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          payment_method_types: ["card"],
          customer_email: order.email,
          client_reference_id: order.id,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: order.currency,
                unit_amount: order.amount,
                product_data: {
                  name: order.service_name,
                  description:
                    "Full service for one permit. Government fees are separate. Additional permits require approval.",
                },
              },
            },
          ],
          metadata: { orderId: order.id, clerkUserId: user.id, kind: "service_order" },
          payment_intent_data: { metadata: { orderId: order.id, clerkUserId: user.id } },
          success_url: `${appUrl()}/requests?order=${order.id}`,
          cancel_url: `${appUrl()}/services?service=${service.id}&cancelled=1`,
        },
        { idempotencyKey: `order:${order.id}` },
      )
      await db.query(`UPDATE orders SET stripe_session_id=$2 WHERE id=$1`, [order.id, session.id])
    }
    if (!session.url) throw new HttpError(409, "Checkout is no longer available. Please try again.")
    return Response.json({ url: session.url })
  } catch (error) {
    return errorResponse(error)
  }
}
export async function GET(request: Request) {
  try {
    const user = await actor()
    const id = uuid(new URL(request.url).searchParams.get("id"))
    const row = (
      await database().query(
        `SELECT o.id,o.status,c.id AS case_id FROM orders o LEFT JOIN cases c ON c.order_id=o.id WHERE o.id=$1 AND o.user_id=$2`,
        [id, user.id],
      )
    ).rows[0]
    if (!row) throw new HttpError(404, "Order not found.")
    return Response.json(row)
  } catch (error) {
    return errorResponse(error)
  }
}
