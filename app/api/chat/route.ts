/**
 * Chat API Route - Hugo AI Assistant Backend
 *
 * This endpoint handles chat messages for the Hugo AI assistant.
 * It proxies requests to the Anthropic Claude API and returns
 * AI-generated responses about San Francisco permit requirements.
 *
 * Endpoint: POST /api/chat
 * Auth Required: No (public endpoint)
 *
 * Request Body:
 * {
 *   message: string,      // User's current message
 *   history: Message[]    // Previous messages in conversation
 * }
 *
 * Response:
 * { reply: string }       // Hugo's response
 * or
 * { error: string }       // Error message (status 500)
 *
 * Environment Variables Required:
 * - ANTHROPIC_API_KEY: API key for Claude
 */

import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

// Initialize Anthropic client (uses ANTHROPIC_API_KEY env var)
const client = new Anthropic()

/**
 * System prompt that defines Hugo's personality and behavior.
 * Includes a curated list of SF.gov URLs for accurate linking.
 */
const SYSTEM_PROMPT = `You are Hugo, a friendly AI permit assistant for San Francisco. Your role is to help users find the right city resources for their permit needs.

IMPORTANT: Always direct users to official SF.gov resources. Provide relevant links from the SF.gov sitemap below whenever possible. Your job is to guide users to the right city department, NOT to provide detailed permit information yourself.

## SF.GOV SITEMAP REFERENCE

**Key Services:**
- Business Services: https://sfgov.org/business
- 311 Services Directory: https://sfgov.org/sf311
- Online Payments: https://sfgov.org/onlineservices
- Health Services: https://sfgov.org/residents-sub-category/health-social-services
- Muni & Parking Info: https://sfgov.org/sfmta
- Property Tax: http://www.sftreasurer.org/index.aspx?page=65
- Recreation & Parks: https://sfgov.org/recpark
- Streets & Public Works: https://sfgov.org/dpw
- Taxpayer Assistance: https://sfgov.org/tax
- Office of Cannabis: https://officeofcannabis.sfgov.org/
- Emergency & Police: https://sfgov.org/police

**Permits & Building:**
- SF Planning Department: https://sfplanning.org/
- Building Inspection (DBI): https://sfdbi.org/
- Fire Department Permits: https://sf-fire.org/
- Public Health Permits: https://www.sfdph.org/dph/EH/Permits/default.asp

**City Government:**
- City Agencies Directory: http://sfgov.org/agency
- Mayor's Office: https://sfgov.org/mayor
- Board of Supervisors: https://sfgov.org/bos
- Municipal Codes: http://sfgov.org/open-gov
- Public Notices: https://sfgov.org/public-notices

**Main Sitemap:** https://www.sfgov.org/site-map-find-info

## YOUR BEHAVIOR

You should:
- Ask clarifying questions to understand the user's project
- Direct users to the appropriate SF.gov department with a direct link
- Provide the relevant URL(s) in every response
- Be helpful, concise, and friendly
- Encourage users to verify requirements on the official city website

You should NOT:
- Provide detailed permit requirements (the city website is the authoritative source)
- Provide legal advice
- Guarantee permit approval or timelines
- Make up URLs - only use links from the sitemap above

Always end responses with a relevant link. If unsure which department, direct to SF 311: https://sfgov.org/sf311`

/**
 * POST handler for chat messages
 * Sends user message + history to Claude and returns the response
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { message, history } = await request.json()

    // Build messages array for Claude API
    // Convert our message format to Anthropic's format
    const messages = [
      ...history.map((msg: { sender: string; content: string }) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    // Call Claude API
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages as Anthropic.MessageParam[],
    })

    // Extract text content from response
    // Claude can return multiple content blocks; we want the text one
    const textContent = response.content.find((block) => block.type === "text")
    const reply = textContent && "text" in textContent
      ? textContent.text
      : "I'm sorry, I couldn't generate a response."

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    // Log error for debugging and return user-friendly message
    console.error("Error calling Claude:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get response from AI"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
