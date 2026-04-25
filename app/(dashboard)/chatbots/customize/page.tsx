import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ChatbotCustomizer } from "@/components/chatbot-customizer"
import { getOrProvisionWorkspace } from "@/lib/workspace"
import { db } from "@/lib/db"
import type { Personality } from "@/lib/chatbot-config"
import { DEFAULT_PERSONALITY, generateSystemPrompt } from "@/lib/chatbot-config"

export const metadata: Metadata = {
  title: "Chatbot Customizer — ChatBuilder",
}

export default async function CustomizePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await searchParams

  if (id && typeof id === "string") {
    const ctx = await getOrProvisionWorkspace()
    if (!ctx) notFound()

    const bot = await db.chatbot.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
    })
    if (!bot) notFound()

    const cfg = (bot.config ?? {}) as { primaryColor?: string; personality?: Personality }
    const personality: Personality = cfg.personality ?? DEFAULT_PERSONALITY

    return (
      <ChatbotCustomizer
        initialData={{
          id: bot.id,
          botName: bot.name,
          primaryColor: cfg.primaryColor ?? "#6366f1",
          welcomeMessage: bot.welcomeMessage ?? "Hi! How can I help you today? 👋",
          personality,
          systemPrompt: bot.systemPrompt ?? generateSystemPrompt(bot.name, personality),
        }}
      />
    )
  }

  return <ChatbotCustomizer />
}
