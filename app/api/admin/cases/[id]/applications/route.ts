import { randomUUID } from "node:crypto"
import { staffActor, errorResponse, jsonBody, textField, uuid, HttpError } from "@/lib/server/http"
import { transaction } from "@/lib/server/db"
import { getCase, addEvent } from "@/lib/server/cases"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await staffActor()
    const id = uuid((await params).id)
    const data = await jsonBody(request)
    if (
      !["preparing", "submitted", "corrections", "approved", "denied", "withdrawn"].includes(
        data.status,
      )
    )
      throw new HttpError(400, "Invalid application status.")
    const name = textField(data.permitName, "permit name", 200)
    const department = textField(data.department, "department", 200)
    const reference = textField(data.reference ?? "", "reference", 200, 0)
    await transaction(async (db) => {
      await getCase(db, id, user, true)
      if (data.id) {
        const result = await db.query(
          `UPDATE applications SET permit_name=$3,department=$4,reference=$5,status=$6,updated_at=now() WHERE id=$1 AND case_id=$2 RETURNING id`,
          [uuid(data.id), id, name, department, reference, data.status],
        )
        if (!result.rows.length) throw new HttpError(404, "Application not found.")
      } else
        await db.query(
          `INSERT INTO applications(id,case_id,permit_name,department,reference,status) VALUES($1,$2,$3,$4,$5,$6)`,
          [randomUUID(), id, name, department, reference, data.status],
        )
      await addEvent(
        db,
        id,
        user.id,
        "application",
        `${name}: ${data.status}${reference ? ` (reference ${reference})` : ""}`,
      )
      await db.query(`UPDATE cases SET version=version+1,updated_at=now() WHERE id=$1`, [id])
    })
    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
