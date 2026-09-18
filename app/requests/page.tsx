import { Suspense } from "react"
import { CaseList } from "@/components/case-list"
export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Loading requests…</p>}>
      <CaseList />
    </Suspense>
  )
}
