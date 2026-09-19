import { scheduleEmailDelivery } from "@/lib/server/email"
import { staffActor, errorResponse, jsonBody, textField, uuid, HttpError } from "@/lib/server/http"
import { transaction } from "@/lib/server/db"
import { updateCase } from "@/lib/server/cases"
export const maxDuration = 60

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await staffActor()
    const id = uuid((await params).id)
    const data = await jsonBody(request)
    if (!Number.isInteger(data.version))
      throw new HttpError(400, "Refresh this case before saving.")
    await transaction((db) =>
      updateCase(db, id, user, {
        status: data.status,
        assigneeId: textField(data.assigneeId, "assignee", 200, 0),
        nextAction: textField(data.nextAction, "next action", 1000, 0),
        followUpAt: data.followUpAt ? textField(data.followUpAt, "follow-up date", 50) : null,
        version: data.version,
      }),
    )
    scheduleEmailDelivery()
    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
