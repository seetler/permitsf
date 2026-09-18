import { serviceCatalog } from "../catalog"
export function staffIds() {
  return (process.env.CIVIC_EASY_STAFF_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
export function appUrl() {
  const url = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("Set a secure NEXT_PUBLIC_APP_URL")
  return url.origin
}
export function notificationEmail() {
  return process.env.CIVIC_EASY_NOTIFY_EMAIL || "info@evolvedigitallyllc.com"
}
export function configuredServices() {
  const ready = Boolean(
    process.env.DATABASE_URL &&
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    staffIds().length &&
    process.env.RESEND_API_KEY &&
    process.env.EMAIL_FROM &&
    process.env.CRON_SECRET &&
    process.env.NEXT_PUBLIC_APP_URL,
  )
  return serviceCatalog.map((service) => {
    const raw = process.env[service.priceEnv] ?? "9900"
    const amount =
      /^\d+$/.test(raw) && Number(raw) >= 50 && Number(raw) <= 1000000 ? Number(raw) : null
    return { ...service, amount, available: ready && amount !== null }
  })
}
