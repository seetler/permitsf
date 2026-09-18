"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Send, MapPin, ExternalLink, Loader2, Plus, Check } from "lucide-react"
import { api, saveDraft } from "@/lib/client"
import { formatMoney, type Service } from "@/lib/catalog"
interface Resource {
  id: string
  name: string
  url: string
  description: string
  address: string | null
  locationUrl: string | null
  verifiedAt: string
}
interface Reply {
  answer: string
  summary: string
  recommendations: { serviceId: string; permitName: string; reason: string; service: Service }[]
  resources: Resource[]
}
interface Message {
  id: string
  sender: "user" | "hugo"
  content: string
  reply?: Reply
}
const greeting: Message = {
  id: "welcome",
  sender: "hugo",
  content:
    "Tell me what you want to get done. I'll help identify the permits, and Civic Easy can take care of the paperwork and follow-up.",
}
export default function HugoPage() {
  const [messages, setMessages] = useState<Message[]>([greeting])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const router = useRouter()
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("civic-chat-v1") || "null")
      if (Array.isArray(saved) && saved.length && saved.every((m) => typeof m.content === "string"))
        setMessages(saved)
    } catch {}
    setReady(true)
  }, [])
  useEffect(() => {
    if (ready) {
      try {
        sessionStorage.setItem("civic-chat-v1", JSON.stringify(messages.slice(-21)))
      } catch {}
      bottom.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, ready, busy])
  async function send(value = input) {
    if (!value.trim() || busy) return
    const previous = messages.filter((m) => m.id !== "welcome").slice(-18)
    setMessages((m) => [...m, { id: crypto.randomUUID(), sender: "user", content: value }])
    setInput("")
    setBusy(true)
    setError("")
    try {
      const reply = await api<Reply>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: value,
          history: previous.map(({ sender, content }) => ({ sender, content })),
        }),
      })
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), sender: "hugo", content: reply.answer, reply },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.")
      setInput(value)
    } finally {
      setBusy(false)
    }
  }
  function choose(serviceId: string, summary: string, permitName: string) {
    saveDraft({
      serviceId,
      objective: `${summary}\n\nRequested support: ${permitName}`,
      projectAddress: "",
      requestKey: crypto.randomUUID(),
    })
    router.push(`/services?service=${serviceId}`)
  }
  return (
    <div className="flex h-full flex-col bg-[#f7f8fa]">
      <header className="border-b bg-white px-6 py-5 pl-16 md:pl-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-blue-700 font-semibold">
            Civic Easy concierge
          </p>
          <h1 className="text-xl font-semibold mt-1">A little less paperwork. A lot more done.</h1>
        </div>
        <button
          aria-label="Start a new conversation"
          title="New conversation"
          disabled={busy}
          onClick={() => {
            setMessages([greeting])
            setError("")
          }}
          className="rounded-full p-2 border hover:bg-gray-50"
        >
          <Plus size={18} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 1 && (
            <div className="pb-5">
              <div className="inline-flex rounded-full bg-blue-50 text-blue-800 text-xs font-medium px-3 py-1.5 mb-4">
                A real person takes it from here
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                What would you like
                <br />
                taken care of?
              </h2>
              <p className="mt-3 text-slate-500">
                $99 per permit + government fees. Research, filing, and follow-up included.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.sender === "user" ? "ml-auto max-w-xl" : "max-w-2xl"}>
              <p className="mb-2 text-xs font-semibold text-slate-500">
                {m.sender === "user" ? "You" : "Hugo · Civic Easy"}
              </p>
              <div
                className={`rounded-2xl p-5 whitespace-pre-wrap text-sm leading-7 ${m.sender === "user" ? "bg-blue-700 text-white" : "bg-white border border-slate-200"}`}
              >
                {m.content}
              </div>
              {m.reply?.recommendations.map((r, i) => (
                <div
                  key={`${r.serviceId}-${i}`}
                  className="mt-3 rounded-2xl border border-blue-200 bg-white overflow-hidden"
                >
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold">
                      Suggested permit support · subject to review
                    </p>
                    <h3 className="font-semibold text-lg mt-2">{r.permitName}</h3>
                    <p className="text-sm text-slate-600 mt-2">{r.reason}</p>
                    <div className="flex gap-2 items-center text-sm mt-4 text-slate-600">
                      <Check size={16} className="text-blue-600" />
                      We research, prepare, file, and follow up.
                    </div>
                  </div>
                  <div className="border-t bg-blue-50/50 p-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm">
                      <strong>
                        {r.service.amount === null
                          ? "Price to be confirmed"
                          : formatMoney(r.service.amount)}
                      </strong>{" "}
                      / permit + government fees
                    </span>
                    <button
                      onClick={() => choose(r.serviceId, m.reply!.summary, r.permitName)}
                      className="rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-medium flex items-center gap-2"
                    >
                      Have Civic Easy handle this <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {!!m.reply?.resources.length && (
                <details className="mt-3 text-sm text-slate-500">
                  <summary className="cursor-pointer">Official resources & locations</summary>
                  <div className="mt-2 space-y-3">
                    {m.reply.resources.map((r) => (
                      <div key={r.id} className="rounded-xl border p-4 bg-white">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 font-medium inline-flex gap-2 items-center"
                        >
                          {r.name}
                          <ExternalLink size={13} />
                        </a>
                        <p className="mt-1">{r.description}</p>
                        {r.address && (
                          <a
                            href={r.locationUrl!}
                            target="_blank"
                            rel="noreferrer"
                            className="flex gap-2 mt-2 text-slate-700"
                          >
                            <MapPin size={15} />
                            {r.address}
                          </a>
                        )}
                        <p className="text-xs mt-2">Source checked {r.verifiedAt}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
          {busy && (
            <div role="status" className="text-sm text-slate-500 flex gap-2 items-center">
              <Loader2 className="animate-spin" size={16} />
              Hugo is considering your project…
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}{" "}
              <Link href="/services" className="underline">
                Browse services
              </Link>
            </p>
          )}
          <div ref={bottom} />
        </div>
      </div>
      <div className="border-t bg-white p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 1 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {[
                "Open a café in San Francisco",
                "Add outdoor seating",
                "Renovate my kitchen in SF",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy}
                  className="border rounded-full px-3 py-2 text-xs text-slate-600 hover:border-blue-400"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="flex gap-3"
          >
            <input
              aria-label="Tell Hugo about your project"
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              placeholder="I want to get a permit for…"
              className="flex-1 min-w-0 rounded-xl border bg-slate-50 px-4 py-3 text-sm focus:outline-blue-500"
            />
            <button
              aria-label="Send message"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-blue-700 text-white px-4 disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-3">
            You describe the goal. We take care of the next steps.
          </p>
        </div>
      </div>
    </div>
  )
}
