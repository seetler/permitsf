"use client"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Paperclip, Send, Loader2, FileText, Lock } from "lucide-react"
import { api } from "@/lib/client"
import { caseStatuses, statusLabels, formatMoney, type CaseStatus } from "@/lib/catalog"
interface CaseData {
  id: string
  service_name: string
  scope: string
  objective: string
  project_address: string
  amount: number
  status: CaseStatus
  version: number
  assignee_id?: string | null
  next_action?: string
  follow_up_at?: string | null
  email?: string
  order_status: string
}
interface Application {
  id: string
  permit_name: string
  department: string
  reference: string
  status: string
}
interface Detail {
  case: CaseData
  events: {
    id: string
    kind: string
    body: string
    internal: boolean
    created_at: string
    author: string
  }[]
  documents: { id: string; name: string; size: number }[]
  applications: Application[]
}
const field = "w-full rounded-lg border p-2.5 text-sm bg-white"
const action =
  "rounded-lg bg-blue-700 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-40"
function localTime(value: string | null | undefined) {
  if (!value) return ""
  const d = new Date(value)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
export function CaseDetail({ id, team = false }: { id: string; team?: boolean }) {
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [body, setBody] = useState("")
  const [kind, setKind] = useState("message")
  const [notice, setNotice] = useState("")
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [plan, setPlan] = useState({
    status: "received",
    assigneeId: "",
    nextAction: "",
    followUpAt: "",
    version: 0,
  })
  const [application, setApplication] = useState({
    id: "",
    permitName: "",
    department: "",
    reference: "",
    status: "preparing",
  })
  const load = useCallback(async () => {
    const d = await api<Detail>(`/api/cases/${id}${team ? "?team=1" : ""}`)
    setData(d)
    setPlan({
      status: d.case.status,
      assigneeId: d.case.assignee_id || "",
      nextAction: d.case.next_action || "",
      followUpAt: localTime(d.case.follow_up_at),
      version: d.case.version,
    })
  }, [id, team])
  useEffect(() => {
    load().catch((e) => setError(e.message))
    if (team)
      api<{ members: { id: string; name: string }[] }>("/api/staff")
        .then((d) => setMembers(d.members))
        .catch((e) => setError(e.message))
  }, [load, team])
  async function perform(work: () => Promise<unknown>, message: string) {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await work()
      await load()
      setNotice(message)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="max-w-6xl mx-auto p-6 pt-20 md:p-10">
      <Link
        href={team ? "/operations" : "/requests"}
        className="text-sm text-slate-500 inline-flex gap-2 items-center"
      >
        <ArrowLeft size={16} />
        {team ? "All cases" : "My requests"}
      </Link>
      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 text-red-700 p-4 text-sm">
          {error}{" "}
          <button
            onClick={() =>
              load()
                .then(() => setError(""))
                .catch((e) => setError(e.message))
            }
            className="underline"
          >
            Refresh
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {notice}
        </p>
      )}
      {!data ? (
        !error && <p className="mt-8 text-slate-500">Loading your request…</p>
      ) : (
        <>
          <div className="my-7 flex flex-wrap gap-4 justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Request {id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className="text-3xl font-semibold mt-2">{data.case.service_name}</h1>
              <p className="text-slate-500 mt-2">
                {team
                  ? data.case.email
                  : "Your Civic Easy specialist will contact you for anything we need."}
              </p>
            </div>
            <span
              className={`text-sm rounded-full px-4 py-2 ${data.case.status === "action_needed" ? "bg-amber-100 text-amber-900" : "bg-blue-50 text-blue-800"}`}
            >
              {statusLabels[data.case.status]}
            </span>
          </div>
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            <div className="space-y-6">
              <section className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold">The project</h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-7 mt-3">
                  {data.case.objective}
                </p>
                <p className="text-sm text-slate-500 mt-3">{data.case.project_address}</p>
              </section>
              <section className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-5">Updates & messages</h2>
                <div className="space-y-5">
                  {data.events.map((e) => (
                    <div
                      key={e.id}
                      className={`border-l-2 pl-4 ${e.internal ? "border-amber-300 bg-amber-50/50 py-2" : "border-blue-200"}`}
                    >
                      <p className="text-xs text-slate-400 flex gap-2 items-center">
                        {e.internal && <Lock size={12} />}{" "}
                        {e.internal
                          ? "Staff only"
                          : e.kind === "request"
                            ? "Information requested"
                            : e.author || "Civic Easy"}{" "}
                        · {new Date(e.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700 mt-1">
                        {e.body}
                      </p>
                    </div>
                  ))}
                </div>
                <form
                  className="mt-6 border-t pt-5 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    perform(
                      async () => {
                        await api(`/api/cases/${id}/messages`, {
                          method: "POST",
                          body: JSON.stringify({ body, kind }),
                        })
                        setBody("")
                      },
                      kind === "note" ? "Internal note saved." : "Message sent.",
                    )
                  }}
                >
                  {team && (
                    <select
                      aria-label="Message visibility"
                      className={field}
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      <option value="message">Message to client</option>
                      <option value="request">Request information from client</option>
                      <option value="note">Internal staff note</option>
                    </select>
                  )}
                  <label className="sr-only" htmlFor="case-message">
                    Your message
                  </label>
                  <textarea
                    id="case-message"
                    required
                    maxLength={4000}
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={
                      kind === "request"
                        ? "List the specific details, documents, or authorization you need…"
                        : kind === "note"
                          ? "Only your team can see this note…"
                          : "Write a message…"
                    }
                    className={field}
                  />
                  <button
                    disabled={busy || !body.trim()}
                    className={`${action} inline-flex gap-2 items-center`}
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{" "}
                    {kind === "note"
                      ? "Save internal note"
                      : kind === "request"
                        ? "Send information request"
                        : "Send message"}
                  </button>
                </form>
              </section>
              <section className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold">Documents</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Shared privately between you and Civic Easy. PDF, JPG, or PNG up to 3 MB.
                </p>
                <div className="mt-4 space-y-3">
                  {data.documents.map((d) => (
                    <a
                      key={d.id}
                      href={`/api/documents/${d.id}`}
                      className="flex gap-2 items-center text-sm text-blue-700 underline"
                    >
                      <FileText size={16} />
                      {d.name}{" "}
                      <span className="text-slate-400 no-underline">
                        ({Math.ceil(d.size / 1024)} KB)
                      </span>
                    </a>
                  ))}
                </div>
                <label
                  className={`inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-2 mt-4 cursor-pointer ${busy ? "opacity-40" : ""}`}
                >
                  <Paperclip size={16} />
                  Upload a document
                  <input
                    aria-label="Upload a document"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    disabled={busy}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ""
                      if (file) {
                        if (file.size > 3_000_000) {
                          setError("Choose a file smaller than 3 MB.")
                          return
                        }
                        const form = new FormData()
                        form.append("file", file)
                        perform(
                          () => api(`/api/cases/${id}/documents`, { method: "POST", body: form }),
                          "Document shared securely.",
                        )
                      }
                    }}
                  />
                </label>
              </section>
              <section className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold">Permit applications</h2>
                <p className="text-sm text-slate-500 mt-1">
                  City application statuses are separate from the work on your case.
                </p>
                {!data.applications.length && (
                  <p className="text-sm text-slate-400 mt-4">
                    Your specialist will add application details after reviewing the permit path.
                  </p>
                )}
                <div className="space-y-3 mt-4">
                  {data.applications.map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 text-sm">
                      <p className="font-medium">{a.permit_name}</p>
                      <p className="text-slate-500 mt-1">
                        {a.department} · {a.status}
                        {a.reference && ` · ${a.reference}`}
                      </p>
                      {team && (
                        <button
                          className="text-blue-700 mt-2 underline"
                          onClick={() =>
                            setApplication({
                              id: a.id,
                              permitName: a.permit_name,
                              department: a.department,
                              reference: a.reference,
                              status: a.status,
                            })
                          }
                        >
                          Edit application
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {team && (
                  <form
                    className="mt-4 space-y-3 border-t pt-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      perform(async () => {
                        await api(`/api/admin/cases/${id}/applications`, {
                          method: "POST",
                          body: JSON.stringify(application),
                        })
                        setApplication({
                          id: "",
                          permitName: "",
                          department: "",
                          reference: "",
                          status: "preparing",
                        })
                      }, "Application saved.")
                    }}
                  >
                    <p className="text-sm font-medium">
                      {application.id ? "Edit application" : "Add an application"}
                    </p>
                    {(
                      [
                        ["permitName", "Permit name"],
                        ["department", "Department"],
                        ["reference", "City reference (optional)"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="block text-xs text-slate-500">
                        {label}
                        <input
                          required={key !== "reference"}
                          maxLength={200}
                          className={`${field} mt-1`}
                          value={application[key]}
                          onChange={(e) => setApplication((a) => ({ ...a, [key]: e.target.value }))}
                        />
                      </label>
                    ))}
                    <select
                      aria-label="Application status"
                      className={field}
                      value={application.status}
                      onChange={(e) => setApplication((a) => ({ ...a, status: e.target.value }))}
                    >
                      {[
                        "preparing",
                        "submitted",
                        "corrections",
                        "approved",
                        "denied",
                        "withdrawn",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button disabled={busy} className={action}>
                      Save application
                    </button>
                    {application.id && (
                      <button
                        type="button"
                        className="ml-3 text-sm underline"
                        onClick={() =>
                          setApplication({
                            id: "",
                            permitName: "",
                            department: "",
                            reference: "",
                            status: "preparing",
                          })
                        }
                      >
                        Cancel edit
                      </button>
                    )}
                  </form>
                )}
              </section>
            </div>
            <aside className="space-y-5">
              {team && (
                <section className="rounded-xl border bg-white p-5">
                  <h2 className="font-semibold">Work plan</h2>
                  <p className="text-xs text-slate-500 mt-1">Internal · keep the next step clear</p>
                  <form
                    className="space-y-4 mt-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      perform(
                        () =>
                          api(`/api/admin/cases/${id}`, {
                            method: "PATCH",
                            body: JSON.stringify({
                              ...plan,
                              followUpAt: plan.followUpAt
                                ? new Date(plan.followUpAt).toISOString()
                                : null,
                            }),
                          }),
                        "Work plan updated.",
                      )
                    }}
                  >
                    <label className="block text-sm">
                      Status
                      <select
                        className={`${field} mt-1`}
                        value={plan.status}
                        onChange={(e) => setPlan((p) => ({ ...p, status: e.target.value }))}
                      >
                        {caseStatuses.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      Owner
                      <select
                        className={`${field} mt-1`}
                        value={plan.assigneeId}
                        onChange={(e) => setPlan((p) => ({ ...p, assigneeId: e.target.value }))}
                      >
                        <option value="">Choose an owner</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      Next action
                      <textarea
                        rows={3}
                        maxLength={1000}
                        className={`${field} mt-1`}
                        value={plan.nextAction}
                        onChange={(e) => setPlan((p) => ({ ...p, nextAction: e.target.value }))}
                      />
                    </label>
                    <label className="block text-sm">
                      Follow up by
                      <input
                        type="datetime-local"
                        className={`${field} mt-1`}
                        value={plan.followUpAt}
                        onChange={(e) => setPlan((p) => ({ ...p, followUpAt: e.target.value }))}
                      />
                    </label>
                    <button disabled={busy} className={`${action} w-full`}>
                      Save work plan
                    </button>
                  </form>
                </section>
              )}
              <section className="rounded-xl border bg-white p-5">
                <h2 className="font-semibold">Your service</h2>
                <p className="text-2xl font-semibold mt-4">{formatMoney(data.case.amount)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Service fee · {data.case.order_status.replaceAll("_", " ")}
                </p>
                <p className="text-sm leading-6 text-slate-500 mt-4">{data.case.scope}</p>
                <div className="border-t mt-4 pt-4 text-sm leading-6 text-slate-500">
                  Government fees are separate. We'll confirm additional costs and ask for your
                  approval before proceeding.
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
