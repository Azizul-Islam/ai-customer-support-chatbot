"use server"

import { db } from "@/lib/db"
import { getOrProvisionWorkspace } from "@/lib/workspace"

export type SessionRow = {
  id: string
  status: "AI_ACTIVE" | "HUMAN_REQUIRED" | "HUMAN_RESOLVED"
  visitorId: string | null
  createdAt: Date
  updatedAt: Date
  chatbotId: string
  chatbotName: string
  messageCount: number
  lastMessage: string | null
}

export type MessageRow = {
  id: string
  role: "user" | "assistant" | "human_agent"
  content: string
  createdAt: Date
}

export async function getSessions(
  filter: "ALL" | "AI_ACTIVE" | "HUMAN_REQUIRED" = "ALL"
): Promise<SessionRow[]> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return []

  const sessions = await db.chatSession.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      ...(filter !== "ALL" ? { status: filter } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      chatbot: { select: { name: true } },
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
      },
    },
  })

  return sessions.map((s) => ({
    id: s.id,
    status: s.status,
    visitorId: s.visitorId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    chatbotId: s.chatbotId,
    chatbotName: s.chatbot.name,
    messageCount: s._count.messages,
    lastMessage: s.messages[0]?.content ?? null,
  }))
}

export async function getSessionMessages(sessionId: string): Promise<MessageRow[]> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return []

  // Verify session belongs to workspace
  const session = await db.chatSession.findFirst({
    where: { id: sessionId, workspaceId: ctx.workspace.id },
    select: { id: true },
  })
  if (!session) return []

  const messages = await db.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  })

  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }))
}

export async function resolveSession(sessionId: string): Promise<{ ok: boolean }> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false }

  const session = await db.chatSession.findFirst({
    where: { id: sessionId, workspaceId: ctx.workspace.id },
    select: { id: true },
  })
  if (!session) return { ok: false }

  await db.chatSession.update({
    where: { id: sessionId },
    data: { status: "AI_ACTIVE" },
  })

  return { ok: true }
}

export async function sendHumanAgentMessage(
  sessionId: string,
  content: string
): Promise<{ ok: boolean }> {
  const ctx = await getOrProvisionWorkspace()
  if (!ctx) return { ok: false }

  const session = await db.chatSession.findFirst({
    where: { id: sessionId, workspaceId: ctx.workspace.id },
    select: { id: true },
  })
  if (!session) return { ok: false }

  await db.chatMessage.create({
    data: {
      sessionId,
      role: "human_agent",
      content,
    },
  })

  await db.chatSession.update({
    where: { id: sessionId },
    data: { status: "HUMAN_RESOLVED" },
  })

  return { ok: true }
}
