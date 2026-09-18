import { CaseDetail } from "@/components/case-detail"
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <CaseDetail team id={(await params).id} />
}
