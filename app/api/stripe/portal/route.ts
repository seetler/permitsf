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

  const customerId = user.publicMetadata.stripeCustomerId as string | undefined

  if (!customerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 })
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile`,
  })

  return NextResponse.json({ url: session.url })
}
