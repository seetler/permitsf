import { actor, errorResponse, HttpError, jsonBody, textField, uuid } from "@/lib/server/http"
import { transaction } from "@/lib/server/db"
import { postMessage } from "@/lib/server/cases"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await actor()
    const id = uuid((await params).id)
    const data = await jsonBody(request)
    if (!["message", "note", "request"].includes(data.kind))
      throw new HttpError(400, "Invalid message type.")
    await transaction((db) => postMessage(db, id, user, textField(data.body, "message"), data.kind))
    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
