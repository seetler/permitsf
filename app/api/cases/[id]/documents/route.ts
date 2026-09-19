import { scheduleEmailDelivery } from "@/lib/server/email"
import { randomUUID } from "node:crypto"
import { put, del } from "@vercel/blob"
import { actor, errorResponse, HttpError, uuid } from "@/lib/server/http"
import { database, transaction } from "@/lib/server/db"
import { getCase, addEvent, enqueue } from "@/lib/server/cases"
import { appUrl, notificationEmail } from "@/lib/server/config"
export const maxDuration = 60

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await actor()
    const id = uuid((await params).id)
    const row = await getCase(database(), id, user)
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new HttpError(
        503,
        "Document uploads aren't available yet. Please message your specialist.",
      )
    if (Number(request.headers.get("content-length") || 0) > 4_000_000)
      throw new HttpError(413, "Choose a file smaller than 3 MB.")
    const file = (await request.formData()).get("file")
    if (!(file instanceof File) || !file.size || file.size > 3_000_000)
      throw new HttpError(400, "Choose a PDF, JPG, or PNG smaller than 3 MB.")
    const bytes = new Uint8Array(await file.arrayBuffer())
    const pdf = Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-"
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    const png = Buffer.from(bytes.slice(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
    const type = pdf ? "application/pdf" : jpeg ? "image/jpeg" : png ? "image/png" : null
    if (!type || file.type !== type)
      throw new HttpError(400, "This file must be a valid PDF, JPG, or PNG.")
    const documentId = randomUUID()
    const name = file.name.replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 160) || "document"
    const blob = await put(`cases/${id}/${documentId}`, file, {
      access: "private",
      contentType: type,
      addRandomSuffix: false,
    })
    try {
      await transaction(async (db) => {
        await getCase(db, id, user, true)
        await db.query(
          `INSERT INTO documents(id,case_id,uploader_id,name,pathname,content_type,size) VALUES($1,$2,$3,$4,$5,$6,$7)`,
          [documentId, id, user.id, name, blob.pathname, type, file.size],
        )
        await addEvent(db, id, user.id, "document", `Uploaded ${name}`)
        await enqueue(
          db,
          `document:${documentId}`,
          user.staff ? row.email : notificationEmail(),
          "Civic Easy: a document was added",
          `A new document is available on your case.\n${appUrl()}/${user.staff ? "requests" : "operations"}/${id}`,
        )
      })
    } catch (error) {
      await del(blob.pathname).catch(() => {})
      throw error
    }
    scheduleEmailDelivery()
    return Response.json({ id: documentId })
  } catch (error) {
    return errorResponse(error)
  }
}
