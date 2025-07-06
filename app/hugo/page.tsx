"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"
import Image from "next/image"

interface Message {
  id: string
  content: string
  sender: "user" | "hugo"
  timestamp: Date
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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")

    // Simulate Hugo's response
    setTimeout(() => {
      const hugoResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I understand you're looking for permit information. Based on what you've described, you might need several permits. Let me help you identify the specific requirements for your project.",
        sender: "hugo",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, hugoResponse])
    }, 1000)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-6">
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

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start space-x-3 max-w-2xl ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div className={`p-2 rounded-full ${message.sender === "user" ? "bg-gray-100" : "bg-blue-100"}`}>
                  {message.sender === "user" ? (
                    <User className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-blue-600" />
                  )}
                </div>
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
            <Button onClick={handleSendMessage} className="px-6">
              <Send className="h-4 w-4" />
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
