import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(key)
}

export async function POST() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stripe = getStripe()

  // Check if user already has a Stripe customer ID
  let customerId = user.publicMetadata.stripeCustomerId as string | undefined

  if (!customerId) {
    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email: user.emailAddresses[0]?.emailAddress,
      metadata: {
        clerkUserId: userId,
      },
    })
    customerId = customer.id
  }

  // Create checkout session for monthly subscription
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/permits?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/permits?canceled=true`,
    metadata: {
      clerkUserId: userId,
    },
    subscription_data: {
      metadata: {
        clerkUserId: userId,
      },
    },
  })

  return NextResponse.json({ url: session.url })
}
