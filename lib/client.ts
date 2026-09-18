export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options?.headers,
    },
  })
  const body = await response
    .json()
    .catch(() => ({ error: "Something went wrong. Please try again." }))
  if (!response.ok) throw new Error(body.error || "Something went wrong. Please try again.")
  return body
}
export const draftKey = "civic-easy-purchase-v1"
export interface PurchaseDraft {
  serviceId: string
  objective: string
  projectAddress: string
  requestKey: string
}
export function saveDraft(draft: PurchaseDraft) {
  try {
    sessionStorage.setItem(draftKey, JSON.stringify(draft))
  } catch {}
}
