"use server"

import { db } from "@/lib/db"
import { getOrProvisionWorkspace } from "@/lib/workspace"
import type { Personality } from "@/lib/chatbot-config"

export interface SaveChatbotInput {
  id?: string
  name: string
  primaryColor: string
  welcomeMessage: string
  personality: Personality
  systemPrompt: string
}

export type SaveChatbotResult =
  | { ok: true; chatbotId: string }
  | { ok: false; error: string }

export async function saveChatbot(input: SaveChatbotInput): Promise<SaveChatbotResult> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  const { workspace } = ctx
  const { id, name, primaryColor, welcomeMessage, personality, systemPrompt } = input

  const config = { primaryColor, personality }

  try {
    if (id) {
      // Verify ownership before update
      const existing = await db.chatbot.findFirst({
        where: { id, workspaceId: workspace.id },
        select: { id: true },
      })
      if (!existing) return { ok: false, error: "Chatbot not found" }

      await db.chatbot.update({
        where: { id },
        data: { name, welcomeMessage, systemPrompt, config },
      })
      return { ok: true, chatbotId: id }
    }

    const chatbot = await db.chatbot.create({
      data: {
        name,
        welcomeMessage,
        systemPrompt,
        config,
        workspaceId: workspace.id,
      },
    })
    return { ok: true, chatbotId: chatbot.id }
  } catch (err) {
    console.error("[saveChatbot]", err)
    return { ok: false, error: "Failed to save chatbot" }
  }
}
