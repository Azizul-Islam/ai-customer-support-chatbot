import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ChatWindow, FloatingChatWidget } from "@/components/chat-window"
import type { Personality } from "@/lib/chatbot-config"

type ChatMode = "ai" | "human"

export default async function ChatbotIframePage({
  params,
  searchParams,
}: {
  params: Promise<{ chatbotId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [{ chatbotId }, sp] = await Promise.all([params, searchParams])
  const isEmbed = sp.embed === "1"
  const mode: ChatMode = typeof sp.mode === "string" && sp.mode === "human" ? "human" : "ai"

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { id: true, name: true, welcomeMessage: true, config: true, status: true },
  })

  if (!chatbot || chatbot.status === "ARCHIVED") notFound()

  const cfg = (chatbot.config ?? {}) as { primaryColor?: string; personality?: Personality }
  const config = {
    chatbotId: chatbot.id,
    botName: chatbot.name,
    welcomeMessage: chatbot.welcomeMessage ?? "Hi! How can I help you today? 👋",
    primaryColor: cfg.primaryColor ?? "#6366f1",
    mode,
  }

  // Embed mode: fill the iframe cleanly (loader.js constrains the size)
  if (isEmbed) {
    return (
      <div className="h-dvh w-full overflow-hidden">
        <ChatWindow config={config} />
      </div>
    )
  }

  // Preview / standalone: show as floating widget over a demo background
  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-100">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #64748b 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Center copy */}
      <div className="relative z-10 max-w-sm text-center">
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg"
          style={{ backgroundColor: config.primaryColor }}
        >
          {config.botName.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-semibold text-gray-800">{config.botName}</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Click the button in the bottom-right corner to start chatting.
        </p>
      </div>

      <FloatingChatWidget config={config} />
    </div>
  )
}
