import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { staffIds } from "@/lib/server/config"
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in?redirect_url=%2Foperations")
  if (!staffIds().includes(userId))
    return (
      <div className="p-10 pt-20">
        <h1 className="text-2xl font-semibold">Team workspace</h1>
        <p className="mt-3 text-slate-500">
          This workspace is available to configured Civic Easy staff accounts.
        </p>
      </div>
    )
  return children
}
