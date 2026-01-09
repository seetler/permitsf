/**
 * Hugo AI Assistant Page
 *
 * This is the main AI chatbot interface where users can ask questions
 * about San Francisco permit requirements. Hugo is powered by Claude AI
 * and provides helpful responses with links to SF.gov resources.
 *
 * Route: /hugo
 * Auth Required: No (public page)
 *
 * Features:
 * - Real-time chat interface
 * - Message history maintained in component state
 * - Loading state while waiting for AI response
 * - Quick-start prompt buttons for common questions
 * - Responsive design with mobile support
 *
 * API Integration:
 * - Sends messages to /api/chat endpoint
 * - Receives AI responses from Claude API
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Bot, User, Loader2 } from "lucide-react"
import Image from "next/image"

/**
 * Message interface for chat history
 * @property id - Unique identifier (timestamp-based)
 * @property content - Message text content
 * @property sender - Either "user" or "hugo"
 * @property timestamp - When the message was sent
 */
interface Message {
  id: string
  content: string
  sender: "user" | "hugo"
  timestamp: Date
}

export default function HugoPage() {
  // Chat message history, initialized with Hugo's greeting
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi! I'm Hugo, your AI permit assistant. I can help you find and understand what permits you need for your project. What are you planning to do?",
      sender: "hugo",
      timestamp: new Date(),
    },
  ])

  // Current input field value
  const [inputValue, setInputValue] = useState("")

  // Loading state while waiting for AI response
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Handles sending a message to the AI
   * 1. Adds user message to chat
   * 2. Calls /api/chat endpoint
   * 3. Adds AI response to chat
   */
  const handleSendMessage = async () => {
    // Prevent empty messages or double-sending while loading
    if (!inputValue.trim() || isLoading) return

    // Create user message object
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    // Add user message to chat and clear input
    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)

    try {
      // Send message to Claude API via our backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          history: messages.slice(1), // Skip the initial greeting for context
        }),
      })

      const data = await response.json()

      // Create Hugo's response message
      const hugoResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.error ? `Error: ${data.error}` : data.reply,
        sender: "hugo",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, hugoResponse])
    } catch (error) {
      // Handle network or parsing errors
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, something went wrong. Please try again.",
        sender: "hugo",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Hugo avatar and title */}
      <div className="bg-white border-b border-gray-200 p-6 pl-16 md:pl-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image
              src="/images/hugo.jpg"
              alt="Hugo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hugo</h1>
            <p className="text-gray-600">Your AI Permit Assistant</p>
          </div>
        </div>
      </div>

      {/* Chat messages area (scrollable) */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start space-x-3 max-w-2xl ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                {/* Avatar icon */}
                <div className={`p-2 rounded-full ${message.sender === "user" ? "bg-gray-100" : "bg-blue-100"}`}>
                  {message.sender === "user" ? (
                    <User className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                {/* Message bubble */}
                <Card className={message.sender === "user" ? "bg-blue-600 text-white" : "bg-white"}>
                  <CardContent className="p-4">
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input area with quick prompts */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Message input and send button */}
          <div className="flex space-x-4">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Hugo about permits you need..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} className="px-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {/* Quick-start prompt buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setInputValue("I want to build a deck")}>
              Building a deck
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInputValue("Starting a food truck business")}>
              Food truck business
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInputValue("Home renovation")}>
              Home renovation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
