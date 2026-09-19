import { scheduleEmailDelivery } from "@/lib/server/email"
import { clerkClient } from "@clerk/nextjs/server"
import Stripe from "stripe"
import { transaction } from "@/lib/server/db"
import { addEvent, enqueue, fulfillOrder } from "@/lib/server/cases"
import { appUrl, notificationEmail } from "@/lib/server/config"
export const maxDuration = 60

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
    return Response.json({ error: "Webhook not configured" }, { status: 503 })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") || "",
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === "payment" && session.metadata?.kind === "service_order") {
        const paymentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id
        if (session.payment_status === "paid" && !paymentId) throw new Error("Missing payment ID")
        await transaction((db) =>
          fulfillOrder(db, {
            orderId: session.metadata!.orderId,
            sessionId: session.id,
            paymentId: paymentId || "",
            amount: session.amount_total ?? -1,
            currency: session.currency || "",
            paid: session.payment_status === "paid",
            userId: session.metadata!.clerkUserId,
          }),
        )
      } else if (
        session.mode === "subscription" &&
        session.metadata?.clerkUserId &&
        session.payment_status === "paid"
      ) {
        const clerk = await clerkClient()
        await clerk.users.updateUserMetadata(session.metadata.clerkUserId, {
          publicMetadata: {
            subscriptionTier: "paid",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        })
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription
      if (subscription.metadata.clerkUserId) {
        const clerk = await clerkClient()
        await clerk.users.updateUserMetadata(subscription.metadata.clerkUserId, {
          publicMetadata: {
            subscriptionTier:
              event.type !== "customer.subscription.deleted" &&
              ["active", "trialing"].includes(subscription.status)
                ? "paid"
                : "free",
            ...(event.type === "customer.subscription.deleted"
              ? { stripeSubscriptionId: null }
              : {}),
          },
        })
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge
      const paymentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id
      const intent = paymentId ? await stripe.paymentIntents.retrieve(paymentId) : null
      if (paymentId && intent?.metadata.orderId)
        await transaction(async (db) => {
          const row = (
            await db.query<{ id: string; case_id: string; status: string }>(
              `SELECT o.id,o.status,c.id AS case_id FROM orders o JOIN cases c ON c.order_id=o.id WHERE stripe_payment_id=$1 FOR UPDATE OF o,c`,
              [paymentId],
            )
          ).rows[0]
          if (!row) throw new Error("Refund awaits original payment fulfillment")
          const status = charge.refunded ? "refunded" : "partially_refunded"
          if (row.status === status || row.status === "refunded") return
          await db.query(`UPDATE orders SET status=$2 WHERE id=$1`, [row.id, status])
          await addEvent(
            db,
            row.case_id,
            "system",
            "note",
            `Payment ${status.replaceAll("_", " ")}. Review the case scope and contact the client.`,
            true,
          )
          await enqueue(
            db,
            `refund:${event.id}`,
            notificationEmail(),
            "Civic Easy: refund needs review",
            `Review refunded payment and case: ${appUrl()}/operations/${row.case_id}`,
          )
        })
    }
    scheduleEmailDelivery()
    return Response.json({ received: true })
  } catch (error) {
    console.error(
      "Stripe fulfillment failed",
      event.id,
      error instanceof Error ? error.name : "Unknown",
    )
    return Response.json({ error: "Fulfillment failed; retry required" }, { status: 500 })
  }
}
