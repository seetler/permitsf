// Hugo AI Assistant - chat interface with streaming responses
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Bot, User, Loader2 } from "lucide-react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  content: string
  sender: "user" | "hugo"
  timestamp: Date
}

// Typing indicator - animated dots shown while awaiting response (added 2026-01-11)
function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

function MessageContent({ message, isLoading }: { message: Message; isLoading: boolean }) {
  if (message.sender === "user") {
    return <p className="text-sm">{message.content}</p>
  }

  if (message.content === "" && isLoading) {
    return <TypingIndicator />
  }

  return (
    <div className="text-sm prose prose-sm max-w-none prose-a:text-blue-600 prose-a:underline">
      <ReactMarkdown>{message.content}</ReactMarkdown>
    </div>
  )
}

export default function HugoPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi! I'm Hugo, your AI permit assistant. I can help you find and understand what permits you need for your project. What are you planning to do?",
      sender: "hugo",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)

    const hugoMessageId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: hugoMessageId, content: "", sender: "hugo", timestamp: new Date() }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, history: messages.slice(1) }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === hugoMessageId ? { ...msg, content: msg.content + chunk } : msg))
          )
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === hugoMessageId ? { ...msg, content: "I'm sorry, something went wrong. Please try again." } : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-6 pl-16 md:pl-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image src="/images/hugo.jpg" alt="Hugo" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hugo</h1>
            <p className="text-gray-600">Your AI Permit Assistant</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-start space-x-3 max-w-2xl ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                <div className={`p-2 rounded-full ${message.sender === "user" ? "bg-gray-100" : "bg-blue-100"}`}>
                  {message.sender === "user" ? <User className="h-4 w-4 text-gray-600" /> : <Bot className="h-4 w-4 text-blue-600" />}
                </div>
                <Card className={message.sender === "user" ? "bg-blue-600 text-white" : "bg-white"}>
                  <CardContent className="p-4">
                    <MessageContent message={message} isLoading={isLoading} />
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

      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
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
