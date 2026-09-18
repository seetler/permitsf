import { actor, errorResponse, HttpError } from "@/lib/server/http"
import { database } from "@/lib/server/db"
import { caseSelect, clientCase, type CaseRow } from "@/lib/server/cases"
export async function GET(request: Request) {
  try {
    const user = await actor()
    const team = new URL(request.url).searchParams.get("team") === "1"
    if (team && !user.staff) throw new HttpError(403, "Staff access required.")
    const rows = (
      await database().query<CaseRow>(
        `${caseSelect} ${team ? "" : "WHERE o.user_id=$1"} ORDER BY c.created_at DESC LIMIT 500`,
        team ? [] : [user.id],
      )
    ).rows
    return Response.json({ cases: team ? rows : rows.map(clientCase) })
  } catch (error) {
    return errorResponse(error)
  }
}
