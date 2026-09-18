// Existing subscription management remains available through /api/stripe/portal.
export async function POST() {
  return Response.json(
    { error: "New services use one-time purchases. Please choose a service at /services." },
    { status: 410 },
  )
}
