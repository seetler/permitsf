import { clerkClient } from "@clerk/nextjs/server"
import { actor, errorResponse } from "@/lib/server/http"
import { staffIds } from "@/lib/server/config"
export async function GET() {
  try {
    const user = await actor()
    if (!user.staff) return Response.json({ staff: false, members: [] })
    const clerk = await clerkClient()
    const { data } = await clerk.users.getUserList({ userId: staffIds(), limit: 100 })
    return Response.json({
      staff: true,
      userId: user.id,
      members: data.map((u) => ({
        id: u.id,
        name:
          [u.firstName, u.lastName].filter(Boolean).join(" ") ||
          u.primaryEmailAddress?.emailAddress ||
          u.id,
      })),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
