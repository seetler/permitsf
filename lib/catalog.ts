export type ServiceId = "business-launch" | "outdoor-use" | "home-project" | "general-permit"
export const serviceCatalog = [
  {
    id: "business-launch",
    name: "Business permit support",
    tagline: "Get your business moving.",
    description:
      "Research, prepare, and coordinate one permit application for your San Francisco business project.",
    scope:
      "Review the project, confirm the permit path, prepare and file one permit application, and handle department follow-up through a decision. Government fees, architectural plans, and licensed professional work are separate.",
    priceEnv: "CIVIC_PRICE_BUSINESS_LAUNCH",
    resourceIds: ["sf-permitting", "permit-center"],
  },
  {
    id: "outdoor-use",
    name: "Outdoor & event permit support",
    tagline: "Make room for your plans.",
    description:
      "Help with the permitting for outdoor business use, street activities, or an event in San Francisco.",
    scope:
      "Confirm the applicable departments, prepare and file one permit application, and coordinate questions and corrections through a decision. Government fees, insurance, drawings, and event operations are separate.",
    priceEnv: "CIVIC_PRICE_OUTDOOR_USE",
    resourceIds: ["sf-permitting", "permit-center"],
  },
  {
    id: "home-project",
    name: "Home project permit support",
    tagline: "Leave the paperwork with us.",
    description:
      "Permit research and filing coordination for your San Francisco home improvement project.",
    scope:
      "Review the project, confirm the permit path, prepare and file one permit application, and follow up through a decision. Government fees, engineering, architectural plans, contractor work, and inspections are separate.",
    priceEnv: "CIVIC_PRICE_HOME_PROJECT",
    resourceIds: ["sf-permitting", "permit-center"],
  },
  {
    id: "general-permit",
    name: "Permit filing support",
    tagline: "Start with a clear path.",
    description:
      "Tell us your goal. A specialist confirms the permit path and handles the filing for one permit.",
    scope:
      "Research, preparation, filing, and department follow-up through a decision for one permit application. Government fees and licensed professional work are separate. Additional permits require a separately approved purchase.",
    priceEnv: "CIVIC_PRICE_GENERAL_PERMIT",
    resourceIds: ["sf-permitting", "permit-center"],
  },
] as const
export const resources = [
  {
    id: "building-permits",
    name: "SF building permits",
    url: "https://www.sf.gov/topics--building-permits",
    description:
      "Official guidance on building, plumbing, electrical, and remodel permitting routes.",
    address: null,
    locationUrl: null,
    verifiedAt: "2026-09-18",
  },
  {
    id: "event-permits",
    name: "SF event permits",
    url: "https://www.sf.gov/topics--event-permitting",
    description:
      "Official guidance on event locations, street closures, food, and entertainment permits.",
    address: null,
    locationUrl: null,
    verifiedAt: "2026-09-18",
  },

  {
    id: "sf-permitting",
    name: "San Francisco permitting",
    url: "https://www.sf.gov/topic-permitting",
    description: "Official starting point for city permit services.",
    address: null,
    locationUrl: null,
    verifiedAt: "2026-09-18",
  },
  {
    id: "permit-center",
    name: "San Francisco Permit Center",
    url: "https://www.sf.gov/location--san-francisco-permit-center",
    description:
      "General in-person permitting assistance. Confirm service availability before visiting; your Civic Easy specialist can handle the coordination.",
    address: "49 South Van Ness Avenue, 2nd floor, San Francisco, CA 94103",
    locationUrl:
      "https://www.google.com/maps/search/?api=1&query=49+South+Van+Ness+Avenue+San+Francisco+CA",
    verifiedAt: "2026-09-18",
  },
] as const
export type Service = (typeof serviceCatalog)[number] & {
  amount: number | null
  available: boolean
}
export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
}
export const caseStatuses = [
  "received",
  "in_progress",
  "action_needed",
  "filed",
  "completed",
  "cancelled",
] as const
export type CaseStatus = (typeof caseStatuses)[number]
export const statusLabels: Record<CaseStatus, string> = {
  received: "Received",
  in_progress: "We're working on it",
  action_needed: "Action needed",
  filed: "Filed",
  completed: "Completed",
  cancelled: "Cancelled",
}

// Curated permit names and applicability notes. Hugo selects IDs, never invents a permit name.
export const permitOptions = [
  {
    id: "building-work",
    name: "Building permit",
    serviceId: "home-project",
    resourceId: "building-permits",
    context:
      "DBI reviews building permit applications. Interior remodel projects have an Over-the-Counter route. The resource does not establish whether a particular minor repair is exempt; ask about scope and do not state a permit is definitely required.",
  },
  {
    id: "plumbing-work",
    name: "Plumbing permit",
    serviceId: "home-project",
    resourceId: "building-permits",
    context:
      "The city's building permit page lists plumbing work as an online permit category. Consider only when the user describes plumbing work; staff confirms exact requirements.",
  },
  {
    id: "electrical-work",
    name: "Electrical permit",
    serviceId: "home-project",
    resourceId: "building-permits",
    context:
      "The city's building permit page lists electrical work as an online permit category. Consider only when the user describes electrical work; staff confirms exact requirements.",
  },
  {
    id: "street-event",
    name: "Street event permit",
    serviceId: "outdoor-use",
    resourceId: "event-permits",
    context:
      "City street events have a special-event permitting route. Location and activities matter; several permits may be involved.",
  },
  {
    id: "event-food",
    name: "Event food permit",
    serviceId: "outdoor-use",
    resourceId: "event-permits",
    context:
      "The city lists food permits for serving or selling food at special events. Staff confirms the applicable food permit.",
  },
  {
    id: "event-entertainment",
    name: "One Time Outdoor Event permit",
    serviceId: "outdoor-use",
    resourceId: "event-permits",
    context:
      "The city lists this permit for outdoor event entertainment or amplified sound. Staff confirms applicability.",
  },
  {
    id: "business-path",
    name: "Business permit research & filing",
    serviceId: "business-launch",
    resourceId: "sf-permitting",
    context:
      "This is a Civic Easy service, NOT an official permit name. For an SF business project whose exact permit is not established by the provided sources, explain that a specialist must confirm which permit is needed. Do not claim this is a city permit or mandatory.",
  },
  {
    id: "general-path",
    name: "Permit research & filing",
    serviceId: "general-permit",
    resourceId: "sf-permitting",
    context:
      "This is a Civic Easy service, NOT an official permit name. Use only for a clear SF permitting project. Explain the uncertainty and that staff must confirm the permit path. Do not sell a filing for an apparently exempt or unrelated activity.",
  },
] as const
