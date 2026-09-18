"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowUpRight, Search, RefreshCw, Briefcase, Clock, CheckCircle2, Plus } from "lucide-react"
import { api, draftKey } from "@/lib/client"
import { caseStatuses, statusLabels, type CaseStatus } from "@/lib/catalog"
interface CaseSummary {
  id: string
  service_name: string
  objective: string
  status: CaseStatus
  created_at: string
  project_address: string
  assignee_id?: string | null
  follow_up_at?: string | null
  next_action?: string
  email?: string
  order_status: string
}
export function CaseList({ team = false }: { team?: boolean }) {
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [owner, setOwner] = useState("all")
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [payment, setPayment] = useState("")
  const [refresh, setRefresh] = useState(0)
  const params = useSearchParams()
  const router = useRouter()
  const order = params.get("order")
  useEffect(() => {
    let alive = true
    setLoading(true)
    api<{ cases: CaseSummary[] }>(`/api/cases${team ? "?team=1" : ""}`)
      .then((d) => {
        if (alive) {
          setCases(d.cases)
          setError("")
        }
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    if (team)
      api<{ members: { id: string; name: string }[] }>("/api/staff")
        .then((d) => setMembers(d.members))
        .catch(() => {})
    return () => {
      alive = false
    }
  }, [team, refresh])
  useEffect(() => {
    if (!order || team) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    let count = 0
    async function poll() {
      try {
        const data = await api<{ status: string; case_id: string | null }>(
          `/api/orders?id=${encodeURIComponent(order!)}`,
        )
        if (!active) return
        if (data.case_id) {
          try {
            sessionStorage.removeItem(draftKey)
          } catch {}
          router.replace(`/requests/${data.case_id}`)
          return
        }
        setPayment(
          count < 12
            ? "Confirming your purchase. Your request will appear as soon as payment is verified."
            : "Payment confirmation is taking longer than usual. You can refresh here; we'll also email you when your request is ready.",
        )
        if (count++ < 12) timer = setTimeout(poll, 2500)
      } catch (e) {
        if (active) setPayment(e instanceof Error ? e.message : "Couldn't check the payment.")
      }
    }
    poll()
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [order, team, router, refresh])
  const active = cases.filter((c) => !["completed", "cancelled"].includes(c.status))
  const overdue = (c: CaseSummary) =>
    !["completed", "cancelled"].includes(c.status) &&
    (!c.assignee_id || (!!c.follow_up_at && new Date(c.follow_up_at) < new Date()))
  const visible = cases.filter(
    (c) =>
      (filter === "all" || (filter === "due" ? overdue(c) : c.status === filter)) &&
      (owner === "all" || (owner === "unassigned" ? !c.assignee_id : c.assignee_id === owner)) &&
      `${c.service_name} ${c.objective} ${c.project_address} ${c.email || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  return (
    <div className="max-w-6xl mx-auto p-6 pt-20 md:p-10">
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-blue-700 font-semibold">
            {team ? "Civic Easy operations" : "Taken care of"}
          </p>
          <h1 className="text-3xl font-semibold mt-3">
            {team ? "The work, moving forward." : "My requests"}
          </h1>
          <p className="text-slate-500 mt-2">
            {team
              ? "Every case has an owner and a next step."
              : "We’ll contact you when we need something. Everything else is with us."}
          </p>
        </div>
        <Link
          href="/hugo"
          className="inline-flex gap-2 items-center rounded-lg border bg-white px-4 py-2 text-sm"
        >
          <Plus size={16} />
          {team ? "New client intake" : "Start a request"}
        </Link>
      </div>
      {payment && (
        <div role="status" className="mt-6 rounded-xl bg-blue-50 text-blue-800 p-4 text-sm">
          {payment}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        {[
          { label: "Active requests", value: active.length, icon: Briefcase },
          {
            label: team ? "Need attention" : "Waiting on you",
            value: team
              ? cases.filter(overdue).length
              : cases.filter((c) => c.status === "action_needed").length,
            icon: Clock,
          },
          {
            label: "Completed",
            value: cases.filter((c) => c.status === "completed").length,
            icon: CheckCircle2,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-5">
            <div className="text-slate-500 text-sm flex items-center gap-2">
              <s.icon size={16} />
              {s.label}
            </div>
            <p className="text-3xl font-semibold mt-3">{loading ? "—" : s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            aria-label="Search requests"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requests…"
            className="w-full border rounded-lg py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          aria-label="Filter status"
          className="border rounded-lg p-2 text-sm bg-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {team && <option value="due">Needs attention</option>}
          {caseStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        {team && (
          <select
            aria-label="Filter owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="border rounded-lg p-2 text-sm bg-white"
          >
            <option value="all">All owners</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        <button
          aria-label="Refresh requests"
          onClick={() => setRefresh((n) => n + 1)}
          className="border rounded-lg p-2 bg-white"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      {error ? (
        <p role="alert" className="bg-red-50 text-red-700 rounded-xl p-5">
          {error}
        </p>
      ) : loading ? (
        <p role="status" className="p-8 text-slate-500">
          Loading requests…
        </p>
      ) : visible.length ? (
        <div className="space-y-3">
          {visible.map((c) => (
            <Link
              key={c.id}
              href={`/${team ? "operations" : "requests"}/${c.id}`}
              className="block rounded-xl border bg-white p-5 hover:border-blue-400 transition"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <div className="flex gap-3 items-center flex-wrap">
                    <h2 className="font-semibold">{c.service_name}</h2>
                    <span
                      className={`text-xs rounded-full px-2.5 py-1 ${c.status === "action_needed" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"}`}
                    >
                      {statusLabels[c.status]}
                    </span>
                    {c.order_status.includes("refunded") && (
                      <span className="text-xs text-red-700">
                        {c.order_status.replaceAll("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 whitespace-pre-wrap">
                    {c.objective}
                  </p>
                  <p className="text-xs text-slate-400 mt-3">
                    {c.project_address} · {new Date(c.created_at).toLocaleDateString()}
                  </p>
                  {team && (
                    <p
                      className={`text-xs mt-3 ${overdue(c) ? "text-amber-700" : "text-slate-500"}`}
                    >
                      {members.find((m) => m.id === c.assignee_id)?.name ||
                        c.assignee_id ||
                        "Unassigned"}{" "}
                      · {c.next_action}
                      {c.follow_up_at &&
                        ` · Follow up ${new Date(c.follow_up_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <ArrowUpRight size={18} className="shrink-0 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <Briefcase className="mx-auto text-blue-500" size={28} />
          <h2 className="font-semibold text-lg mt-4">
            {cases.length
              ? "No matching requests"
              : team
                ? "Ready for your first client"
                : "Your next project starts here"}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {cases.length
              ? "Try a different filter."
              : team
                ? "Confirmed purchases will appear here, ready for you to take over."
                : "Tell Hugo what you want done. We’ll help with the paperwork."}
          </p>
        </div>
      )}
    </div>
  )
}
