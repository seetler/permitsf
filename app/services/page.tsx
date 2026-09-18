"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { SignInButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Check, ArrowRight, Loader2 } from "lucide-react"
import { api, draftKey, saveDraft, type PurchaseDraft } from "@/lib/client"
import { formatMoney, type Service } from "@/lib/catalog"
export default function ServicesPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading services…</p>}>
      <Services />
    </Suspense>
  )
}
function Services() {
  const search = useSearchParams()
  const { isSignedIn, isLoaded } = useUser()
  const [services, setServices] = useState<Service[]>([])
  const [draft, setDraft] = useState<PurchaseDraft>({
    serviceId: search.get("service") || "general-permit",
    objective: "",
    projectAddress: "",
    requestKey: "",
  })
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    api<{ services: Service[] }>("/api/services")
      .then((d) => setServices(d.services))
      .catch((e) => setError(e.message))
    try {
      const stored = JSON.parse(sessionStorage.getItem(draftKey) || "null")
      if (
        stored &&
        typeof stored.objective === "string" &&
        typeof stored.projectAddress === "string"
      )
        setDraft({
          ...stored,
          serviceId: search.get("service") || stored.serviceId,
          requestKey: search.has("cancelled")
            ? crypto.randomUUID()
            : stored.requestKey || crypto.randomUUID(),
        })
      else setDraft((d) => ({ ...d, requestKey: crypto.randomUUID() }))
    } catch {
      setDraft((d) => ({ ...d, requestKey: crypto.randomUUID() }))
    }
    setLoaded(true)
  }, [search])
  useEffect(() => {
    if (loaded) saveDraft(draft)
  }, [draft, loaded])
  function edit(change: Partial<PurchaseDraft>) {
    setDraft((d) => ({ ...d, ...change, requestKey: crypto.randomUUID() }))
    setAccepted(false)
  }
  const selected = services.find((s) => s.id === draft.serviceId)
  async function purchase() {
    setBusy(true)
    setError("")
    try {
      const data = await api<{ url: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ ...draft, accepted }),
      })
      window.location.assign(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.")
      setDraft((d) => ({ ...d, requestKey: crypto.randomUUID() }))
      setBusy(false)
    }
  }
  return (
    <div className="max-w-6xl mx-auto p-6 pt-20 md:p-10">
      <p className="text-xs uppercase tracking-[.18em] text-blue-700 font-semibold">
        Done-for-you permitting
      </p>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-3">
        Your plans. Our legwork.
      </h1>
      <p className="text-slate-500 max-w-2xl mt-3 leading-7">
        One specialist owns your request, figures out the paperwork, and keeps it moving. Tell us
        the basics now. We’ll gather the details with you after purchase.
      </p>
      {search.has("cancelled") && (
        <p role="status" className="mt-6 rounded-xl bg-amber-50 p-4 text-amber-900 text-sm">
          Checkout was cancelled. Your draft is saved here when you're ready.
        </p>
      )}
      <div className="grid lg:grid-cols-[1fr_400px] gap-8 mt-8">
        <div className="space-y-4">
          {services.map((s) => (
            <button
              key={s.id}
              disabled={busy}
              onClick={() => edit({ serviceId: s.id })}
              className={`w-full text-left rounded-2xl border p-5 transition ${draft.serviceId === s.id ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" : "bg-white border-slate-200 hover:border-slate-400"}`}
            >
              <div className="flex justify-between gap-4">
                <h2 className="font-semibold">{s.name}</h2>
                <span className="font-semibold whitespace-nowrap">
                  {s.amount === null ? "Unavailable" : formatMoney(s.amount)}
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-6 mt-2">{s.description}</p>
              <p className="text-xs text-blue-700 mt-3">One permit · government fees separate</p>
            </button>
          ))}
          {!services.length && !error && <p>Loading services…</p>}
          <div className="p-5 text-sm leading-7 text-slate-500">
            <p className="font-medium text-slate-800">What happens after checkout?</p>
            <p>
              We review your project, contact you for any details or authorization we need, and
              handle the filing and department follow-up. Additional permits or work require your
              approval.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6 h-fit">
          <h2 className="text-xl font-semibold">Let’s take this off your list.</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              purchase()
            }}
            className="space-y-5 mt-5"
          >
            <div>
              <label htmlFor="objective" className="block text-sm font-medium mb-2">
                What would you like done?
              </label>
              <textarea
                id="objective"
                required
                minLength={10}
                maxLength={4000}
                rows={4}
                value={draft.objective}
                disabled={busy}
                onChange={(e) => edit({ objective: e.target.value })}
                placeholder="I’m opening a café and need help with…"
                className="w-full border rounded-lg p-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-2">
                Project location in San Francisco
              </label>
              <input
                id="address"
                required
                minLength={3}
                maxLength={500}
                value={draft.projectAddress}
                disabled={busy}
                onChange={(e) => edit({ projectAddress: e.target.value })}
                placeholder="Address, or neighborhood if not yet known"
                className="w-full border rounded-lg p-3 text-sm"
              />
            </div>
            {selected && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-semibold">{selected.name}</p>
                <p className="text-slate-600 leading-6 mt-2">{selected.scope}</p>
                <p className="mt-3 font-medium">
                  Service fee:{" "}
                  {selected.amount === null ? "Not available" : formatMoney(selected.amount)}
                </p>
                <p className="text-slate-500 mt-1">
                  Government fees are additional and confirmed before payment. Approval is
                  determined by the city.
                </p>
              </div>
            )}
            <label className="flex gap-3 text-xs leading-5 text-slate-600">
              <input
                type="checkbox"
                required
                checked={accepted}
                disabled={busy}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1"
              />
              <span>
                I understand this purchase covers one permit application and the service scope
                above. Additional permits and costs require my approval.
              </span>
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            {!selected?.available && services.length > 0 && (
              <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
                Online checkout is being prepared. Your draft will stay here in this browser tab.
              </p>
            )}
            {isLoaded && !isSignedIn ? (
              <SignInButton mode="modal" forceRedirectUrl="/services">
                <button
                  type="button"
                  className="w-full rounded-lg bg-blue-700 p-3 text-sm text-white font-medium"
                >
                  Sign in to continue · draft saved
                </button>
              </SignInButton>
            ) : (
              <button
                type="submit"
                disabled={
                  busy || !isLoaded || !accepted || !selected?.available || !draft.requestKey
                }
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-700 p-3 text-sm text-white font-medium disabled:opacity-40"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Continue to secure checkout
              </button>
            )}
            <p className="text-xs text-slate-400 flex gap-2 justify-center">
              <Check size={14} />
              One-time purchase. No subscription.
            </p>
          </form>
        </div>
      </div>
      <p className="text-sm text-slate-500 mt-5">
        Not sure which service fits?{" "}
        <Link href="/hugo" className="text-blue-700 underline">
          Talk to Hugo
        </Link>
      </p>
    </div>
  )
}
