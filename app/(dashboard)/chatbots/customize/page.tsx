import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ChatbotCustomizer } from "@/components/chatbot-customizer"
import { getOrProvisionWorkspace } from "@/lib/workspace"
import { db } from "@/lib/db"
import type { Personality } from "@/lib/chatbot-config"
import { DEFAULT_PERSONALITY, generateSystemPrompt } from "@/lib/chatbot-config"
import {
  getChatbotKnowledgeSources,
  getAvailableKnowledgeSources,
} from "@/app/actions/chatbot"

export const metadata: Metadata = {
  title: "Chatbot Customizer — ChatBuilder",
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export default async function CustomizePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const botId = typeof sp.id === "string" ? sp.id : null

  const ctx = await getOrProvisionWorkspace()
  if (!ctx) notFound()

  const availableSources = await getAvailableKnowledgeSources()

  if (botId) {
    const bot = await db.chatbot.findUnique({
      where: { id: botId },
    })
    if (!bot || bot.workspaceId !== ctx.workspace.id) notFound()

    const cfg = (bot.config ?? {}) as {
      primaryColor?: string
      personality?: Personality
      defaultMode?: "ai" | "human"
    }
    const personality: Personality = cfg.personality ?? DEFAULT_PERSONALITY

    const attachedSources = await getChatbotKnowledgeSources(botId)

    return (
      <ChatbotCustomizer
        appUrl={APP_URL}
        availableSources={availableSources}
        initialData={{
          id: bot.id,
          botName: bot.name,
          primaryColor: cfg.primaryColor ?? "#6366f1",
          welcomeMessage: bot.welcomeMessage ?? "Hi! How can I help you today? 👋",
          personality,
          systemPrompt: bot.systemPrompt ?? generateSystemPrompt(bot.name, personality),
          attachedSourceIds: attachedSources.map((s) => s.id),
          defaultMode: cfg.defaultMode ?? "ai",
          status: bot.status,
        }}
      />
    )
  }

  return (
    <ChatbotCustomizer appUrl={APP_URL} availableSources={availableSources} />
  )
}
