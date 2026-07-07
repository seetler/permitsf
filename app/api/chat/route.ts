// POST /api/chat - Streaming OpenAI endpoint for Hugo assistant
import OpenAI from "openai"
import { NextRequest } from "next/server"

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

function chatError(message: string, status = 500) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

function getOpenAIErrorMessage(error: unknown) {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return "OpenAI rejected the API key. Please create a new key, update OPENAI_API_KEY, and restart the dev server."
    }

    if (error.status === 429) {
      return "OpenAI rejected the request because the account has no available quota or hit a rate limit. Please check OpenAI billing and usage."
    }

    return `OpenAI returned an error: ${error.message}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return "The chat service hit an unexpected error."
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return chatError("OPENAI_API_KEY is not set. Add it to .env.local, then restart the dev server.", 500)
  }

  let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
  try {
    const { message, history = [] } = await request.json()
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((msg: { sender: string; content: string }) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    const client = new OpenAI({ apiKey })
    stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      stream: true,
    })
  } catch (error) {
    return chatError(getOpenAIErrorMessage(error))
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      } catch (error) {
        controller.enqueue(encoder.encode(getOpenAIErrorMessage(error)))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
