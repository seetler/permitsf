/**
 * Homepage - Root Route (/)
 *
 * This page immediately redirects to /hugo (the AI assistant).
 * The Hugo AI assistant is the main entry point for users to
 * discover what permits they need.
 *
 * Route: /
 * Auth Required: No
 * Redirects To: /hugo
 */

import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/hugo")
}
