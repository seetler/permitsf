import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic()

const SYSTEM_PROMPT = `You are Hugo, a friendly and knowledgeable AI permit assistant for San Francisco. Your role is to help users understand what permits they need for their projects.

You should:
- Ask clarifying questions to understand the user's project
- Explain which permits might be required and why
- Provide general guidance on the permit process
- Be helpful, concise, and friendly

You should NOT:
- Provide legal advice
- Guarantee permit approval
- Give specific timelines (as these vary)

If you're unsure about something, recommend the user contact the relevant SF department directly.`

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    const messages = [
      ...history.map((msg: { sender: string; content: string }) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages as Anthropic.MessageParam[],
    })

    const textContent = response.content.find((block) => block.type === "text")
    const reply = textContent && "text" in textContent ? textContent.text : "I'm sorry, I couldn't generate a response."

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    console.error("Error calling Claude:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get response from AI"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
