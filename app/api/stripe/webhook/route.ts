import { clerkClient } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(key)
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const clerk = await clerkClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const clerkUserId = session.metadata?.clerkUserId

      if (clerkUserId) {
        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            subscriptionTier: "paid",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        })
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const clerkUserId = subscription.metadata?.clerkUserId

      if (clerkUserId) {
        const isActive = subscription.status === "active" || subscription.status === "trialing"
        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            subscriptionTier: isActive ? "paid" : "free",
          },
        })
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const clerkUserId = subscription.metadata?.clerkUserId

      if (clerkUserId) {
        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            subscriptionTier: "free",
            stripeSubscriptionId: null,
          },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
