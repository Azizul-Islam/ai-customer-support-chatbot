import type { Metadata } from "next"
import { ChatbotCustomizer } from "@/components/chatbot-customizer"

export const metadata: Metadata = {
  title: "Chatbot Customizer — ChatBuilder",
}

export default function CustomizePage() {
  return <ChatbotCustomizer />
}
