import { get } from "@vercel/blob"
import { actor, errorResponse, HttpError, uuid } from "@/lib/server/http"
import { database } from "@/lib/server/db"
import { getDocument } from "@/lib/server/cases"
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await actor()
    const id = uuid((await params).id)
    const db = database()
    const doc = await getDocument(db, id, user)
    const blob = await get(doc.pathname, { access: "private" })
    if (!blob || blob.statusCode !== 200) throw new HttpError(404, "Document not found.")
    return new Response(blob.stream, {
      headers: {
        "Content-Type": doc.content_type,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
