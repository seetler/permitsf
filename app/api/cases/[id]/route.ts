import { actor, errorResponse, uuid } from "@/lib/server/http"
import { database } from "@/lib/server/db"
import { readCaseDetail } from "@/lib/server/cases"
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await actor()
    const id = uuid((await params).id)
    return Response.json(
      await readCaseDetail(
        database(),
        id,
        user,
        new URL(request.url).searchParams.get("team") === "1",
      ),
    )
  } catch (error) {
    return errorResponse(error)
  }
}
