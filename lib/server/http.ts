import { auth } from "@clerk/nextjs/server"
import { staffIds } from "./config"
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export async function actor() {
  const { userId } = await auth()
  if (!userId) throw new HttpError(401, "Please sign in to continue.")
  return { id: userId, staff: staffIds().includes(userId) }
}
export async function staffActor() {
  const user = await actor()
  if (!user.staff) throw new HttpError(403, "This workspace is for Civic Easy staff.")
  return user
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status })
  console.error("Civic Easy request failed", error instanceof Error ? error.name : "Unknown error")
  return Response.json(
    { error: "We couldn't complete that request. Please try again shortly." },
    { status: 503 },
  )
}
export function textField(value: unknown, name: string, max = 4000, min = 1) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max)
    throw new HttpError(400, `Please provide a valid ${name}.`)
  return value.trim()
}
export function uuid(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
    throw new HttpError(400, "Invalid request identifier.")
  return value
}
export async function jsonBody(request: Request) {
  const text = await request.text()
  if (text.length > 32000) throw new HttpError(413, "This request is too large.")
  try {
    const data = JSON.parse(text)
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error()
    return data
  } catch {
    throw new HttpError(400, "Invalid request body.")
  }
}
