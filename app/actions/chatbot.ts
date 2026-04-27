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
  defaultMode?: "ai" | "human"
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED"
}

export type SaveChatbotResult =
  | { ok: true; chatbotId: string }
  | { ok: false; error: string }

export async function getChatbotKnowledgeSources(
  chatbotId: string
): Promise<{ id: string; name: string }[]> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return []

  const chatbot = await db.chatbot.findFirst({
    where: { id: chatbotId, workspaceId: ctx.workspace.id },
    select: { id: true },
  })
  if (!chatbot) return []

  const sources = await db.chatbotKnowledgeSource.findMany({
    where: { chatbotId },
    include: { knowledgeSource: { select: { id: true, name: true } } },
  })

  return sources.map((s) => ({ id: s.knowledgeSource.id, name: s.knowledgeSource.name }))
}

export async function setChatbotKnowledgeSources(
  chatbotId: string,
  sourceIds: string[]
): Promise<{ ok: boolean }> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false }

  const chatbot = await db.chatbot.findFirst({
    where: { id: chatbotId, workspaceId: ctx.workspace.id },
    select: { id: true },
  })
  if (!chatbot) return { ok: false }

  const validSources = await db.knowledgeSource.findMany({
    where: {
      id: { in: sourceIds },
      workspaceId: ctx.workspace.id,
      status: "READY",
    },
    select: { id: true },
  })
  const validIds = new Set(validSources.map((s) => s.id))

  await db.$transaction([
    db.chatbotKnowledgeSource.deleteMany({ where: { chatbotId } }),
    ...Array.from(validIds).map((sourceId) =>
      db.chatbotKnowledgeSource.create({
        data: { chatbotId, knowledgeSourceId: sourceId },
      })
    ),
  ])

  return { ok: true }
}

export async function getAvailableKnowledgeSources(): Promise<
  { id: string; name: string; status: string }[]
> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return []

  return db.knowledgeSource.findMany({
    where: { workspaceId: ctx.workspace.id, status: "READY" },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  })
}

export async function saveChatbot(input: SaveChatbotInput): Promise<SaveChatbotResult> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false, error: "Not authenticated" }

  const { workspace } = ctx
  const { id, name, primaryColor, welcomeMessage, personality, systemPrompt, defaultMode, status } = input

  const config = { primaryColor, personality, defaultMode: defaultMode ?? "ai" }

  console.log("SERVER saveChatbot - id:", id, "name:", name, "status:", status)

  try {
    if (id) {
      console.log("SERVER - Attempting UPDATE for:", id)
      // Verify ownership before update
      const existing = await db.chatbot.findFirst({
        where: { id, workspaceId: workspace.id },
        select: { id: true },
      })
      if (!existing) return { ok: false, error: "Chatbot not found" }

      await db.chatbot.update({
        where: { id },
        data: { name, welcomeMessage, systemPrompt, config, status },
      })
      console.log("SERVER - Updated successfully")
      return { ok: true, chatbotId: id }
    }

    console.log("SERVER - Creating NEW chatbot")
    const chatbot = await db.chatbot.create({
      data: {
        name,
        welcomeMessage,
        systemPrompt,
        config,
        status: status ?? "DRAFT",
        workspaceId: workspace.id,
      },
    })
    return { ok: true, chatbotId: chatbot.id }
  } catch (err) {
    console.error("[saveChatbot]", err)
    return { ok: false, error: "Failed to save chatbot" }
  }
}
